.PHONY: build
build:
	npm run update:locale
	ELECTRON_SKIP_NOTARIZE=1 ELECTRON_SKIP_SENTRY=1 npm run dist:mac

.PHONY: build-dev
build-dev:
	npm run build:dev

.PHONY: run
run:
	unset ELECTRON_RUN_AS_NODE && SERVER_PORT=8080 ANYPROF=:8082 npm run start:dev --user-data-dir="/Users/mika/notes-apps/anytype/local_dev"

.PHONY: run-local
run-local:
	unset ELECTRON_RUN_AS_NODE && SERVER_PORT=8080 ANYTYPE_USE_SIDE_SERVER=http://127.0.0.1:31008 ANYPROF=:8082 npm run start:dev-debug

.PHONY: run2
run2:
	unset ELECTRON_RUN_AS_NODE && SERVER_PORT=8080 ANYPROF=:8082 DATA_PATH="/Users/mika/notes-apps/anytype/local_dev" npm run start:dev

.PHONY: typecheck
typecheck:
	npm run typecheck

.PHONY: lint
lint:
	npm run lint

.PHONY: update-middleware
update-middleware:
	./update.sh macos-latest arm64
	cp darwin-arm64/anytypeHelper dist/anytypeHelper
