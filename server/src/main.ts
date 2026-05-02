import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  app.enableCors({
    origin: ['http://10.0.0.36:8081', 'http://172.20.10.2:8081', 'http://10.0.0.36:8080', 'http://10.0.0.34:8080', 'http://172.20.10.2:8080', 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  app.setGlobalPrefix('api');
  await app.listen(3000);
}
bootstrap();
