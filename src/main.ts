import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './http-exception/http-exception.filter';
import * as cookieParser from 'cookie-parser';
import * as hbs from 'hbs';
import * as session from 'express-session';
import * as flash from 'connect-flash';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  hbs.registerPartials(join(__dirname, '..', 'views/partials'));

  hbs.registerHelper('eq', function(a, b) {
    return a === b;
  });

  // (YYYY-MM-DD)
  hbs.registerHelper('formatDate', function(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  // (YYYY-MM-DD HH:MM)
  hbs.registerHelper('formatDateTime', function(date) {
    if (!date) return '';
    const d = new Date(date);
    return `${d.toISOString().split('T')[0]} ${d.toTimeString().split(' ')[0].substring(0, 5)}`;
  });

  // (YYYY-MM-DDTHH:MM)
  hbs.registerHelper('formatDateTimeLocal', function(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  });

  hbs.registerHelper('jsonStringify', function(obj) {
    if (!obj) return '';
    return JSON.stringify(obj);
  });

  hbs.registerHelper('jsonPretty', function(obj) {
    if (!obj) return '';
    return JSON.stringify(obj, null, 2);
  });

  hbs.registerHelper('capitalize', function(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  });

  hbs.registerHelper('profitMargin', function(sellingPrice, costPrice) {
    const margin = ((sellingPrice - costPrice) / sellingPrice) * 100;
    return margin.toFixed(2);
  });

  app.useGlobalFilters(
    new HttpExceptionFilter()
  );

  app.use(session({
    secret: 'rahasia',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 }
  }));
  
  app.use(flash());

  app.use(cookieParser());
    
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();