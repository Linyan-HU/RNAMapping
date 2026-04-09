# web_template_Jekyll

Jekyll-hosted static version of the RNAcentre template.

## Run locally

```bash
cd ~/coding/web_template_Jekyll
bundle install
bundle exec jekyll serve --livereload
```

Open:
- http://127.0.0.1:4000/

## Notes
- Frontend remains static (no Liquid templating required).
- `src/`, `pdbfiles/`, and `singlecell-viewer/` are explicitly included in `_config.yml`.
