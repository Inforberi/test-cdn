.PHONY: help build up down restart logs shell clean dev prod check-docker docker-start

# Переменные
COMPOSE = docker compose
DOCKER = docker
CONTAINER = strapi-data-to-table

# Цвета для вывода
GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
NC = \033[0m # No Color

# Проверка Docker daemon
check-docker:
	@if ! $(DOCKER) info > /dev/null 2>&1; then \
		echo "$(RED)Ошибка: Docker daemon не запущен!$(NC)"; \
		echo "$(YELLOW)Запусти Docker Desktop или Docker daemon и попробуй снова.$(NC)"; \
		echo "$(YELLOW)Или выполни: make docker-start$(NC)"; \
		exit 1; \
	fi

docker-start: ## Запустить Docker Desktop (macOS)
	@echo "$(GREEN)Запуск Docker Desktop...$(NC)"
	@open -a Docker 2>/dev/null || echo "$(RED)Не удалось запустить Docker Desktop. Убедись, что Docker Desktop установлен.$(NC)"
	@echo "$(YELLOW)Подожди несколько секунд, пока Docker запустится...$(NC)"

help: ## Показать справку по командам
	@echo "$(GREEN)Доступные команды:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

build: check-docker ## Собрать Docker образ
	@echo "$(GREEN)Сборка Docker образа...$(NC)"
	$(COMPOSE) build --no-cache

up: check-docker ## Запустить контейнеры
	@echo "$(GREEN)Запуск контейнеров...$(NC)"
	$(COMPOSE) up -d

down: check-docker ## Остановить контейнеры
	@echo "$(GREEN)Остановка контейнеров...$(NC)"
	$(COMPOSE) down

restart: check-docker ## Перезапустить контейнеры
	@echo "$(GREEN)Перезапуск контейнеров...$(NC)"
	$(COMPOSE) restart

logs: check-docker ## Показать логи контейнеров
	$(COMPOSE) logs -f

shell: check-docker ## Открыть shell в контейнере
	$(DOCKER) exec -it $(CONTAINER) sh

clean: check-docker ## Удалить контейнеры, образы и volumes
	@echo "$(GREEN)Очистка Docker ресурсов...$(NC)"
	$(COMPOSE) down -v --rmi all
	$(DOCKER) system prune -f

dev: ## Запустить в режиме разработки (локально)
	@echo "$(GREEN)Запуск в режиме разработки...$(NC)"
	pnpm dev

prod: build up ## Собрать и запустить в production режиме
	@echo "$(GREEN)Приложение запущено на http://localhost:3000$(NC)"

rebuild: down build up ## Пересобрать и перезапустить
	@echo "$(GREEN)Пересборка завершена$(NC)"

status: check-docker ## Показать статус контейнеров
	$(COMPOSE) ps

stop: check-docker ## Остановить контейнеры без удаления
	@echo "$(GREEN)Остановка контейнеров...$(NC)"
	$(COMPOSE) stop

start: check-docker ## Запустить остановленные контейнеры
	@echo "$(GREEN)Запуск контейнеров...$(NC)"
	$(COMPOSE) start
