<script setup lang="ts">
import { computed, ref } from 'vue'

const query = ref('')
const selectedCategory = ref('Все товары')
const sortBy = ref('Популярные')
const cartCount = ref(4)
const categories = ['Все товары', 'Смартфоны', 'Планшеты', 'Умный дом', 'ТВ и проекторы', 'Аксессуары']
const products = [
  { name: 'Xiaomi 14T Pro', description: '12 + 512 ГБ, титан серый', price: '69 990', oldPrice: '89 990', category: 'Смартфоны', image: 'phone', label: 'Хит продаж', tone: 'sand' },
  { name: 'Redmi Note 13 Pro', description: '8 + 256 ГБ, midnight black', price: '29 990', oldPrice: '34 990', category: 'Смартфоны', image: 'phone', label: '−14%', tone: 'blue' },
  { name: 'Xiaomi Pad 6', description: '8 + 256 ГБ, Gravity Gray', price: '34 990', oldPrice: '39 990', category: 'Планшеты', image: 'tablet', label: 'Новинка', tone: 'lilac' },
  { name: 'Xiaomi Robot Vacuum S10+', description: 'Робот-пылесос с влажной уборкой', price: '27 990', oldPrice: '34 990', category: 'Умный дом', image: 'vacuum', label: 'Выгодная цена', tone: 'mint' },
  { name: 'Xiaomi TV A Pro 55', description: '4K UHD, QLED, Google TV', price: '44 990', oldPrice: '54 990', category: 'ТВ и проекторы', image: 'tv', label: '−18%', tone: 'gray' },
  { name: 'Redmi Buds 5 Pro', description: 'Активное шумоподавление', price: '6 490', oldPrice: '7 990', category: 'Аксессуары', image: 'buds', label: 'Хит продаж', tone: 'pink' },
  { name: 'Xiaomi Smart Band 9', description: 'Графитовый чёрный', price: '3 990', oldPrice: '4 990', category: 'Аксессуары', image: 'watch', label: 'Новинка', tone: 'cream' },
  { name: 'Xiaomi Electric Scooter 4', description: 'Запас хода до 35 км', price: '49 990', oldPrice: '59 990', category: 'Умный дом', image: 'scooter', label: '−17%', tone: 'blue' },
]
const visibleProducts = computed(() => products.filter(p => (selectedCategory.value === 'Все товары' || p.category === selectedCategory.value) && `${p.name} ${p.description}`.toLowerCase().includes(query.value.toLowerCase())))
</script>

<template>
  <div class="store">
    <div class="promo">Скидка 3% на первый заказ <span>Подробнее →</span></div>
    <header class="header">
      <div class="utility"><span>Москва и область⌄</span><nav><a>Магазины</a><a>Доставка и оплата</a><a>Программа привилегий</a><a>Рассрочка</a><a>Блог</a></nav><span>+7 (495) 105-91-60　 С 9:00 до 22:00</span></div>
      <div class="main-header"><a class="logo" href="#"><span class="mi">mi</span></a><nav class="main-nav"><a>Смартфоны</a><a>Для дома</a><a>ТВ</a><a>Другое</a><a>Носимые устройства</a><a>Аксессуары</a><a>Умный дом</a><a class="sale">Акции</a></nav><div class="header-actions"><button aria-label="Поиск">⌕</button><button aria-label="Профиль">♙</button><button aria-label="Корзина" class="cart">♧<i>{{ cartCount }}</i></button></div></div>
    </header>
    <main>
      <div class="breadcrumbs">Главная <span>/</span> Каталог</div>
      <div class="title-row"><div><h1>Каталог товаров</h1><p>Технологии, которые делают жизнь проще</p></div><div class="count">{{ visibleProducts.length }} товаров</div></div>
      <section class="hero"><div class="hero-copy"><span class="hero-kicker">НОВАЯ СЕРИЯ</span><h2>Xiaomi 14T Series</h2><p>Мастерство ночной съёмки<br>в каждом кадре</p><button>Выбрать смартфон <b>→</b></button></div><div class="hero-orb orb-one"></div><div class="hero-orb orb-two"></div><div class="hero-phone"><div class="phone-camera"><i></i><i></i><i></i></div></div><div class="hero-dots"><i class="chosen"></i><i></i><i></i></div></section>
      <section class="category-strip"><button v-for="(cat, i) in categories.slice(1)" :key="cat" @click="selectedCategory = cat" class="category-tile" :class="'cat-'+i"><span class="category-art">{{ ['◉','▱','⌂','▣','◌'][i] }}</span><span>{{ cat }}</span><b>→</b></button></section>
      <section class="catalog"><aside class="filters"><div class="filter-head"><h3>Фильтры</h3><button @click="selectedCategory = 'Все товары'; query = ''">Сбросить</button></div><div class="filter-group"><h4>Категория <span>−</span></h4><label v-for="cat in categories" :key="cat"><input type="radio" name="category" :value="cat" v-model="selectedCategory"><span>{{ cat }}</span><small>{{ cat === 'Все товары' ? products.length : products.filter(p => p.category === cat).length }}</small></label></div><div class="filter-group"><h4>Цена, ₽ <span>−</span></h4><div class="price-inputs"><input placeholder="От"><span>—</span><input placeholder="До"></div><div class="range"><i></i></div></div><div class="filter-group"><h4>Бренд <span>−</span></h4><label><input type="checkbox" checked><span>Xiaomi</span><small>24</small></label><label><input type="checkbox"><span>Redmi</span><small>18</small></label><label><input type="checkbox"><span>POCO</span><small>7</small></label></div><button class="filter-apply">Показать {{ visibleProducts.length }} товара</button></aside>
        <div class="product-area"><div class="category-tabs"><button v-for="cat in categories" :key="cat" @click="selectedCategory = cat" :class="{ active: selectedCategory === cat }">{{ cat }}</button></div><div class="toolbar"><div class="result-label">Показано <b>{{ visibleProducts.length }}</b> товаров</div><label class="search"><span>⌕</span><input v-model="query" placeholder="Найти товар"></label><label class="sort">Сортировка: <select v-model="sortBy"><option>Популярные</option><option>Сначала дешевле</option><option>Сначала дороже</option></select></label><button class="view-toggle">▦</button></div>
          <div class="products"><article v-for="product in visibleProducts" :key="product.name" class="product-card"><div class="product-visual" :class="product.tone"><span class="label">{{ product.label }}</span><button class="favorite" aria-label="В избранное">♡</button><div class="product-art" :class="product.image"><template v-if="product.image === 'phone'"><div class="phone-cam"><i></i><i></i><i></i></div></template><template v-else-if="product.image === 'tablet'"><i class="tablet-screen"></i></template><template v-else-if="product.image === 'vacuum'"><i class="vacuum-top"></i></template><template v-else-if="product.image === 'tv'"><i class="tv-screen"></i></template><template v-else-if="product.image === 'buds'"><i class="bud b1"></i><i class="bud b2"></i></template><template v-else-if="product.image === 'watch'"><i class="watch-face"></i></template><template v-else><i class="scooter-deck"></i><i class="scooter-wheel"></i></template></div><div class="color-dots"><i></i><i></i><i></i></div></div><div class="product-info"><h3>{{ product.name }}</h3><p>{{ product.description }}</p><div class="rating"><span>★★★★★</span> <small>4.9　(128)</small></div><div class="price-row"><strong>{{ product.price }} ₽</strong><del>{{ product.oldPrice }} ₽</del></div><button class="add-cart" @click="cartCount++">В корзину <span>＋</span></button></div></article><div v-if="!visibleProducts.length" class="no-results">Ничего не найдено. Попробуйте изменить запрос.</div></div>
          <div class="pagination"><button>←</button><button class="current">1</button><button>2</button><button>3</button><span>…</span><button>8</button><button>→</button></div>
        </div>
      </section>
      <section class="benefits"><div><strong>◉</strong><span>Официальная гарантия<small>На всю продукцию Xiaomi</small></span></div><div><strong>▱</strong><span>Бесплатная доставка<small>При заказе от 5 000 ₽</small></span></div><div><strong>₽</strong><span>Удобная оплата<small>В том числе в рассрочку</small></span></div><div><strong>↻</strong><span>Лёгкий возврат<small>В течение 14 дней</small></span></div></section>
    </main>
    <footer><div class="footer-top"><div><h2>Подпишитесь и будьте в курсе</h2><p>Последние обновления, новинки и специальные предложения</p></div><form @submit.prevent><input placeholder="Email"><button>Подписаться</button></form></div><div class="footer-bottom"><span>© Xiaomi 2024</span><span>Политика конфиденциальности　　Условия использования</span><span>Мы в социальных сетях　◉　◉　◉</span></div></footer>
  </div>
</template>
