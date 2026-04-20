Backend:
- [x] auth (db)
  - [x] db schema/model
  - [x] crud.py + its services
  - [x] access_token
- [x] user (db)
  - [x] db schema/model
  - [x] crud.py + its services for user
  - [x] crud endpoints in routes.py
  - [x] /me - token

- [ ] docs
  - [x] db schema/model
  - [x] CRUD API for /doc
  - [ ] GET /docs
  - [ ] share edits via websockets

- [ ] /latex
  - [ ] simple inline render
  - [ ] simple multiline render
  - [ ] caching for doc?
  - [ ]

Frontend:
- [ ] /
  - [ ] simple with call to action -> /signin redirects to /docs
  - [ ] Reformat to mimic modern polished look w/ empty image slots for previews
  - [ ] Take preview images (gifs?)
- [ ] /docs
  - [ ] placeholder simple list of id
- [ ] /docs/d/{id}
  - [ ] Basic text editor w/o LaTeX

Hosting:
- [ ] Host on free public domain
- [ ] Scalable infra
  - [ ] ...
- [ ] 

Safeguards:
- [ ] Ensure document max-size exists and enforced to prevent abuse

Test:
- [ ] Go through decision-tree style all possible frontend/backend interactions to ensure every case has been accounted for
Make a /test (maybe python unittest?) for frontend/backend to mimic real working env
