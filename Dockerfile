# Usa a imagem oficial do Node.js como base
FROM node:20

# Define o diretório de trabalho
WORKDIR /usr/src/app

# Copia o package.json e package-lock.json
COPY package*.json ./

# Instala as dependências
RUN npm install --production

# Copia o restante do código
COPY ./src ./src
COPY ./dist ./dist
# COPY .env .
COPY .env.example .
COPY discloud.config .
COPY tsconfig.json .

EXPOSE 8080

CMD ["node", "dist/index.js"]