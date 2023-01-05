FROM public.ecr.aws/lambda/nodejs:18

COPY package.json .env.local ${LAMBDA_TASK_ROOT}

RUN npm install

COPY index.js ${LAMBDA_TASK_ROOT}

CMD ["index.handler"]