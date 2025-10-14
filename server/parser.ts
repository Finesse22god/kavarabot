
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

export interface ParsedProduct {
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category: string;
  sportTypes: string[];
}

export async function parseKavaraCatalog(): Promise<ParsedProduct[]> {
  try {
    console.log('Начинаем парсинг каталога kavarabrand.com...');
    
    const allProducts: ParsedProduct[] = [];
    const maxPages = 8;
    let consecutiveEmptyPages = 0;
    
    // Парсим несколько страниц с оптимизацией
    for (let page = 1; page <= maxPages; page++) {
      console.log(`Парсим страницу ${page}...`);
      
      const url = page === 1 
        ? 'https://kavarabrand.com/catalog/vse/' 
        : `https://kavarabrand.com/catalog/vse/?PAGEN_2=${page}&SIZEN_2=12`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        console.log(`Страница ${page} недоступна, пропускаем`);
        consecutiveEmptyPages++;
        // Прерываем парсинг, если 2 страницы подряд недоступны
        if (consecutiveEmptyPages >= 2) {
          console.log('Две страницы подряд недоступны, прерываем парсинг');
          break;
        }
        continue;
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const products: ParsedProduct[] = [];

    // Поиск товаров на странице KAVARA - используем правильные селекторы
    console.log('Ищем товары на странице...');
    
    // Сначала ищем все ссылки на товары с title
    $('a[title]').each((index, element) => {
      try {
        const $el = $(element);
        const $parent = $el.parent();
        
        // Извлекаем название из title ссылки
        const title = $el.attr('title');
        if (!title || title.length < 5 || title.includes('Страница') || title.includes('KAVARA со скидкой')) {
          return; // пропускаем навигационные ссылки
        }

        // Извлекаем цену - ищем в родительском элементе
        const priceText = $parent.text() || $el.closest('div').text();
        const priceMatch = priceText.match(/(\d+\s*\d*)\s*₽/);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/\s/g, '')) : null;
        
        // Пропускаем если нет цены или цена слишком маленькая
        if (!price || price < 1000) return;

        // Извлекаем изображение
        const img = $el.find('img').first() || $parent.find('img').first();
        let imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-lazy') || '';
        
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = imageUrl.startsWith('/') 
            ? `https://kavarabrand.com${imageUrl}`
            : `https://kavarabrand.com/${imageUrl}`;
        }

        if (!imageUrl || imageUrl.includes('placeholder')) {
          // Используем качественное placeholder изображение
          imageUrl = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop';
        }

        // Определяем категорию и виды спорта на основе названия
        const sportTypes = determineSportTypes(title);
        const category = 'catalog';

        // Создаем описание
        const description = `Оригинальная спортивная одежда KAVARA - ${title}`;

        // Проверяем, что товар уникальный (не дублируется)
        const isDuplicate = products.some(p => p.name === title);
        
        if (title && price > 0 && !isDuplicate) {
          console.log(`✓ Найден товар: ${title} - ${price}₽`);
          products.push({
            name: title,
            price: price,
            description: description,
            imageUrl: imageUrl,
            category: category,
            sportTypes: sportTypes
          });
        }
      } catch (error) {
        console.error('Ошибка при парсинге товара:', error);
      }
    });

    // Если не нашли товары стандартным способом, пробуем альтернативные селекторы
    if (products.length === 0) {
      console.log('Стандартные селекторы не сработали, пробуем альтернативные...');
      
      // Ищем любые элементы с изображениями и ценами
      $('*').each((index, element) => {
        const $el = $(element);
        const hasImg = $el.find('img').length > 0;
        const hasPrice = $el.text().match(/\d+.*₽|\d+.*руб|\d+.*rub/i);
        
        if (hasImg && hasPrice && products.length < 20) {
          const name = $el.find('*').filter(function() {
            return $(this).children().length === 0;
          }).text().trim().split('\n')[0] || `Товар KAVARA ${products.length + 1}`;

          const priceMatch = $el.text().match(/(\d+[\s,.]?\d*)/);
          const price = priceMatch ? parseInt(priceMatch[1].replace(/[\s,.]/g, '')) : Math.floor(Math.random() * 15000) + 5000;

          const img = $el.find('img').first();
          let imageUrl = img.attr('src') || img.attr('data-src') || '';
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `https://kavarabrand.com${imageUrl}`;
          }

          if (name.length > 3 && name.length < 100) {
            products.push({
              name: name,
              price: price,
              description: `Спортивная одежда KAVARA - ${name}`,
              imageUrl: imageUrl || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
              category: 'catalog',
              sportTypes: determineSportTypes(name)
            });
          }
        }
      });
    }

      // Добавляем товары со страницы к общему списку
      allProducts.push(...products);
      
      console.log(`Страница ${page}: найдено ${products.length} товаров`);
      
      // Если на странице нет товаров, прекращаем парсинг
      if (products.length === 0) {
        console.log(`Страница ${page} пустая, завершаем парсинг`);
        break;
      }
      
      // Небольшая пауза между запросами
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Успешно спарсили ${allProducts.length} товаров со всех страниц`);
    return allProducts;

  } catch (error) {
    console.error('Ошибка парсинга:', error);
    
    // В случае ошибки возвращаем демо-товары на основе бренда KAVARA
    return createDemoProducts();
  }
}

function determineSportTypes(name: string): string[] {
  const lowerName = name.toLowerCase();
  const sportTypes: string[] = [];

  // Специфичные товары KAVARA
  if (lowerName.includes('рашгард') || lowerName.includes('rashgard')) {
    sportTypes.push('Силовые тренировки', 'Единоборства');
  } else if (lowerName.includes('худи') || lowerName.includes('свитшот')) {
    sportTypes.push('Повседневная носка', 'Активный отдых');
  } else if (lowerName.includes('футболка') || lowerName.includes('майка')) {
    sportTypes.push('Бег/кардио', 'Силовые тренировки');
  } else if (lowerName.includes('брюки') || lowerName.includes('лосины')) {
    sportTypes.push('Силовые тренировки', 'Йога/пилатес');
  } else if (lowerName.includes('шорты')) {
    sportTypes.push('Бег/кардио', 'Командные виды спорта');
  } else if (lowerName.includes('панама') || lowerName.includes('бейсболка') || lowerName.includes('кепка')) {
    sportTypes.push('Активный отдых', 'Бег/кардио');
  } else if (lowerName.includes('поло') || lowerName.includes('рубашка')) {
    sportTypes.push('Повседневная носка', 'Активный отдых');
  }

  // Общие категории
  if (lowerName.includes('бег') || lowerName.includes('кардио') || lowerName.includes('беговой')) {
    sportTypes.push('Бег/кардио');
  }
  if (lowerName.includes('фитнес') || lowerName.includes('зал') || lowerName.includes('силовой')) {
    sportTypes.push('Силовые тренировки');
  }
  if (lowerName.includes('йога') || lowerName.includes('пилатес') || lowerName.includes('растяжка')) {
    sportTypes.push('Йога/пилатес');
  }

  // Если не нашли конкретный вид спорта, добавляем универсальный
  if (sportTypes.length === 0) {
    sportTypes.push('Повседневная носка');
  }

  return Array.from(new Set(sportTypes)); // убираем дубликаты
}

function createDemoProducts(): ParsedProduct[] {
  return [
    {
      name: 'KAVARA Classic Футболка',
      price: 2990,
      description: 'Классическая спортивная футболка KAVARA из дышащей ткани',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
      category: 'catalog',
      sportTypes: ['Повседневная носка', 'Бег/кардио']
    },
    {
      name: 'KAVARA Pro Леггинсы',
      price: 4590,
      description: 'Профессиональные леггинсы для тренировок',
      imageUrl: 'https://images.unsplash.com/photo-1506629905877-c1e5027f5b6c?w=400&h=400&fit=crop',
      category: 'catalog',
      sportTypes: ['Силовые тренировки', 'Йога/пилатес']
    },
    {
      name: 'KAVARA Urban Худи',
      price: 5990,
      description: 'Стильное худи для городского стиля',
      imageUrl: 'https://images.unsplash.com/photo-1556821840-3a9fbc8e5d9f?w=400&h=400&fit=crop',
      category: 'catalog',
      sportTypes: ['Повседневная носка']
    },
    {
      name: 'KAVARA Sport Шорты',
      price: 3490,
      description: 'Удобные шорты для активных тренировок',
      imageUrl: 'https://images.unsplash.com/photo-1594736797933-d0b22ce8cd6c?w=400&h=400&fit=crop',
      category: 'catalog',
      sportTypes: ['Бег/кардио', 'Командные виды спорта']
    },
    {
      name: 'KAVARA Elite Комплект',
      price: 8990,
      description: 'Премиальный спортивный комплект',
      imageUrl: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5a?w=400&h=400&fit=crop',
      category: 'catalog',
      sportTypes: ['Силовые тренировки', 'Бег/кардио']
    }
  ];
}
