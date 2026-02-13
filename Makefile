include .env
export

train:
	@echo ""; \
	echo "Jenga-AI Training"; \
	echo "════════════════════════════════════"; \
	echo ""; \
	echo "Select a config:"; \
	echo ""; \
	i=1; \
	for f in configs/*.yaml; do \
		echo "  $$i) $$f"; \
		i=$$((i + 1)); \
	done; \
	echo ""; \
	read -p "Enter choice [1-$$(ls configs/*.yaml | wc -l)]: " choice; \
	i=1; \
	for f in configs/*.yaml; do \
		if [ "$$i" = "$$choice" ]; then \
			echo ""; \
			echo "🚀 Running: $$f"; \
			echo ""; \
			python3 examples/run_experiment.py --config "$$f"; \
		fi; \
		i=$$((i + 1)); \
	done

train-config:
	python3 examples/run_experiment.py --config $(CONFIG)

train-llm:
	@echo ""; \
	echo "Jenga-AI LLM Fine-tuning"; \
	echo "════════════════════════════════════"; \
	python3 examples/run_llm_finetuning.py --config configs/llm_finetuning.yaml

mlflow:
	mlflow ui --port 5000 --backend-store-uri sqlite:///mlflow.db

tensorboard:
	tensorboard --logdir results/ --port 6006

# List configs
configs:
	@echo "Available configs:"
	@ls -1 configs/*.yaml
	
# Docker
db-up:
	cd docker && docker compose up -d

db-down:
	cd docker && docker compose down

db-reset:
	cd docker && docker compose down -v && docker compose up -d

db-migrate:
	cd backend && alembic revision --autogenerate -m "$(msg)"

db-upgrade:
	cd backend && alembic upgrade head

db-downgrade:
	cd backend && alembic downgrade -1

# Backend
server:
	cd backend && uvicorn app.main:app --reload --port 8000

# Frontend
ui:
	cd frontend && pnpm run dev
# Dev
install:
	pip install -e .

lint:
	ruff check jenga_ai/

test:
	pytest tests/ -v

clean:
	rm -rf results/ mlruns/ __pycache__/

.PHONY: train train-config train-llm mlflow tensorboard configs install lint test clean