import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as hbs from 'hbs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  hbs.registerPartials(join(__dirname, '..', 'views/partials'));

  hbs.registerHelper('eq', function(a, b) {
    return a === b;
  });

  hbs.registerHelper('profitMargin', function(sellingPrice, costPrice) {
    const margin = ((sellingPrice - costPrice) / sellingPrice) * 100;
    return margin.toFixed(2);
  });
  
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

  app.use(cookieParser());
    
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();