"""RunPod API client for launching GPU training pods.

Provides an async httpx-based client for:
- Listing available GPU types
- Creating on-demand pods with training configs
- Monitoring pod status
- Stopping and terminating pods

Requires a RunPod API key (https://www.runpod.io/console/user/settings).
"""

from __future__ import annotations

import logging
from typing import Any, Optional

import httpx

logger = logging.getLogger(__name__)

RUNPOD_API_BASE = "https://api.runpod.io/graphql"
RUNPOD_REST_BASE = "https://api.runpod.io/v2"

# Default Docker image for training pods
DEFAULT_IMAGE = "runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04"

# Default volume size in GB
DEFAULT_VOLUME_GB = 20


class RunPodClient:
    """Async client for RunPod API.

    Args:
        api_key: RunPod API key.
        timeout: HTTP request timeout in seconds.
    """

    def __init__(self, api_key: str, timeout: float = 30.0) -> None:
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        self.timeout = timeout

    async def list_gpu_types(self) -> list[dict[str, Any]]:
        """List available GPU types and their pricing.

        Returns:
            List of GPU type dicts with id, displayName, memoryInGb, etc.
        """
        query = """
        query GpuTypes {
            gpuTypes {
                id
                displayName
                memoryInGb
                secureCloud
                communityCloud
                lowestPrice {
                    minimumBidPrice
                    uninterruptablePrice
                }
            }
        }
        """
        result = await self._graphql(query)
        gpu_types = result.get("data", {}).get("gpuTypes", [])
        logger.info("Found %d GPU types on RunPod", len(gpu_types))
        return gpu_types

    async def create_pod(
        self,
        name: str,
        gpu_type_id: str,
        image: str = DEFAULT_IMAGE,
        env: Optional[dict[str, str]] = None,
        volume_gb: int = DEFAULT_VOLUME_GB,
        cloud_type: str = "ALL",
        gpu_count: int = 1,
        start_command: Optional[str] = None,
    ) -> dict[str, Any]:
        """Create a new GPU pod.

        Args:
            name: Pod name.
            gpu_type_id: GPU type ID from list_gpu_types().
            image: Docker image to use.
            env: Environment variables.
            volume_gb: Volume size in GB.
            cloud_type: SECURE, COMMUNITY, or ALL.
            gpu_count: Number of GPUs.
            start_command: Command to run on pod start.

        Returns:
            Pod creation response with id, status, etc.
        """
        env_list = []
        if env:
            env_list = [{"key": k, "value": v} for k, v in env.items()]

        query = """
        mutation CreatePod($input: PodFindAndDeployOnDemandInput!) {
            podFindAndDeployOnDemand(input: $input) {
                id
                name
                imageName
                desiredStatus
                gpuCount
                volumeInGb
                machine {
                    gpuDisplayName
                }
            }
        }
        """
        variables = {
            "input": {
                "name": name,
                "imageName": image,
                "gpuTypeId": gpu_type_id,
                "cloudType": cloud_type,
                "gpuCount": gpu_count,
                "volumeInGb": volume_gb,
                "containerDiskInGb": 10,
                "env": env_list,
            }
        }
        if start_command:
            variables["input"]["dockerArgs"] = start_command

        result = await self._graphql(query, variables)
        pod = result.get("data", {}).get("podFindAndDeployOnDemand", {})
        logger.info("Created RunPod pod: %s (gpu: %s)", pod.get("id"), gpu_type_id)
        return pod

    async def get_pod(self, pod_id: str) -> dict[str, Any]:
        """Get pod status and details.

        Args:
            pod_id: Pod ID from create_pod().

        Returns:
            Pod details with status, runtime info, etc.
        """
        query = """
        query Pod($podId: String!) {
            pod(input: { podId: $podId }) {
                id
                name
                desiredStatus
                imageName
                gpuCount
                volumeInGb
                runtime {
                    uptimeInSeconds
                    gpus {
                        id
                        gpuUtilPercent
                        memoryUtilPercent
                    }
                }
                machine {
                    gpuDisplayName
                }
            }
        }
        """
        result = await self._graphql(query, {"podId": pod_id})
        return result.get("data", {}).get("pod", {})

    async def stop_pod(self, pod_id: str) -> dict[str, Any]:
        """Stop a running pod (preserves data).

        Args:
            pod_id: Pod ID.

        Returns:
            Response dict.
        """
        query = """
        mutation StopPod($podId: String!) {
            podStop(input: { podId: $podId }) {
                id
                desiredStatus
            }
        }
        """
        result = await self._graphql(query, {"podId": pod_id})
        pod = result.get("data", {}).get("podStop", {})
        logger.info("Stopped RunPod pod: %s", pod_id)
        return pod

    async def terminate_pod(self, pod_id: str) -> dict[str, Any]:
        """Terminate a pod (deletes everything).

        Args:
            pod_id: Pod ID.

        Returns:
            Response dict.
        """
        query = """
        mutation TerminatePod($podId: String!) {
            podTerminate(input: { podId: $podId })
        }
        """
        result = await self._graphql(query, {"podId": pod_id})
        logger.info("Terminated RunPod pod: %s", pod_id)
        return result

    async def _graphql(
        self,
        query: str,
        variables: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """Execute a GraphQL query against RunPod API."""
        payload: dict[str, Any] = {"query": query}
        if variables:
            payload["variables"] = variables

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                RUNPOD_API_BASE,
                headers=self.headers,
                json=payload,
            )
            response.raise_for_status()
            return response.json()


def build_runpod_command(config_yaml: str, output_dir: str = "/workspace/results") -> str:
    """Build the shell command to execute training inside a RunPod pod.

    Args:
        config_yaml: YAML config contents (will be written to file).
        output_dir: Output directory inside the pod.

    Returns:
        Shell command string.
    """
    # Escape single quotes in YAML
    escaped_yaml = config_yaml.replace("'", "'\\''")

    return (
        f"pip install torch transformers datasets peft accelerate scikit-learn pyyaml tensorboard && "
        f"echo '{escaped_yaml}' > /workspace/config.yaml && "
        f"python -m jenga_ai train --config /workspace/config.yaml --output-dir {output_dir}"
    )
