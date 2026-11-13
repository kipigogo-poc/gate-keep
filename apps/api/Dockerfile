# Cloud Run image. Build from the repo root: docker build -f apps/api/Dockerfile .
FROM node:22-slim AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm ci -w @gatekeep/api -w @gatekeep/shared --include-workspace-root
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @gatekeep/shared && npm run build -w @gatekeep/api

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo/package.json /repo/package-lock.json ./
COPY --from=build /repo/packages/shared/package.json packages/shared/
COPY --from=build /repo/packages/shared/dist packages/shared/dist
COPY --from=build /repo/apps/api/package.json apps/api/
COPY --from=build /repo/apps/api/dist apps/api/dist
RUN npm ci -w @gatekeep/api -w @gatekeep/shared --omit=dev && npm cache clean --force
USER node
CMD ["node", "apps/api/dist/main.js"]
