.PHONY: init

SITE_FILE := sites/default.json

# デフォルト値
DEFAULT_NAME := my-site
DEFAULT_URL := https://example.com
DEFAULT_CLS := 0.1
DEFAULT_LCP := 2500

init:
	@echo "=== sites/default.json を作成します ==="
	@echo "（空Enterでデフォルト値を使用）"
	@echo ""
	@read -p "サイト名 [$(DEFAULT_NAME)]: " name; \
	read -p "ベースURL [$(DEFAULT_URL)]: " url; \
	read -p "CLSしきい値 [$(DEFAULT_CLS)]: " cls; \
	read -p "LCPしきい値(ms) [$(DEFAULT_LCP)]: " lcp; \
	name=$${name:-$(DEFAULT_NAME)}; \
	url=$${url:-$(DEFAULT_URL)}; \
	cls=$${cls:-$(DEFAULT_CLS)}; \
	lcp=$${lcp:-$(DEFAULT_LCP)}; \
	mkdir -p sites; \
	printf '{\n  "name": "%s",\n  "baseUrl": "%s",\n  "pages": [\n    { "name": "トップ", "path": "/" }\n  ],\n  "thresholds": {\n    "CLS": %s,\n    "LCP": %s\n  }\n}\n' \
		"$$name" "$$url" "$$cls" "$$lcp" > $(SITE_FILE); \
	echo ""; \
	echo "$(SITE_FILE) を作成しました:"; \
	cat $(SITE_FILE); \
	echo ""; \
	echo "ページを追加するには $(SITE_FILE) を直接編集してください。"
