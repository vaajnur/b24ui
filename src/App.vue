<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { initializeB24Frame } from '@bitrix24/b24jssdk'

type Company = { id: number; title: string }
type Deal = { id: number | string; title: string; companyId?: number; companyTitle?: string; opportunity?: number; stageName?: string; dateCreate?: string }
type B24Client = Awaited<ReturnType<typeof initializeB24Frame>>

const demoCompanies: Company[] = [
  { id: 101, title: 'ООО «Север»' },
  { id: 102, title: 'ТехноПарк' },
  { id: 103, title: 'Вектор-Медиа' },
  { id: 104, title: 'Мастерская 24' },
]
const demoDeals = ref<Deal[]>([
  { id: 1, title: 'Поставка оборудования', companyId: 101, companyTitle: 'ООО «Север»', opportunity: 240000, stageName: 'Новая' },
  { id: 2, title: 'Разработка сайта', companyId: 103, companyTitle: 'Вектор-Медиа', opportunity: 180000, stageName: 'В работе' },
])
const b24 = ref<B24Client | null>(null)
const deals = ref<Deal[]>(demoDeals.value)
const companies = ref<Company[]>(demoCompanies)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const search = ref('')
const modalOpen = ref(false)
const title = ref('')
const amount = ref<number | null>(null)
const selectedCompanyId = ref<number | string | undefined>()
const companySearch = ref('')
const companyMenuOpen = ref(false)

const filteredDeals = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('ru')
  if (!term) return deals.value
  return deals.value.filter((deal) => `${deal.title} ${deal.companyTitle ?? ''}`.toLocaleLowerCase('ru').includes(term))
})
const totalAmount = computed(() => deals.value.reduce((sum, deal) => sum + Number(deal.opportunity ?? 0), 0))
const filteredCompanies = computed(() => {
  const term = companySearch.value.trim().toLocaleLowerCase('ru')
  return term ? companies.value.filter((company) => company.title.toLocaleLowerCase('ru').includes(term)) : companies.value
})
const selectedCompany = computed(() => companies.value.find((company) => company.id === Number(selectedCompanyId.value)))
const money = (value: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value)
const date = (value?: string) => value ? new Date(value).toLocaleDateString('ru-RU') : '—'

async function portalCall<T = unknown>(method: string, params: Record<string, unknown>): Promise<T> {
  if (!b24.value) throw new Error('Bitrix24 SDK не подключён')
  try {
    const response = await b24.value.actions.v2.call.make<T>({ method, params })
    if (!response.isSuccess) {
      throw new Error(response.getErrorMessages().join('; ') || `Ошибка вызова ${method}`)
    }
    return response.getData()?.result as T
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    throw new Error(`${method}: ${message}`)
  }
}

async function loadPortalData() {
  if (!b24.value) return
  loading.value = true
  error.value = ''
  try {
    const dealResult = await portalCall<Array<{ ID: string | number; TITLE: string; COMPANY_ID?: string | number; OPPORTUNITY?: string | number; STAGE_ID?: string; DATE_CREATE?: string }>>('crm.deal.list', {
      select: ['ID', 'TITLE', 'COMPANY_ID', 'OPPORTUNITY', 'STAGE_ID', 'DATE_CREATE'],
      order: { ID: 'DESC' }, start: 0,
    })
    deals.value = dealResult.map((raw) => {
      const company = companies.value.find((item) => item.id === Number(raw.COMPANY_ID))
      return {
        id: raw.ID, title: raw.TITLE,
        companyId: raw.COMPANY_ID == null ? undefined : Number(raw.COMPANY_ID),
        companyTitle: company?.title, opportunity: Number(raw.OPPORTUNITY ?? 0),
        stageName: raw.STAGE_ID, dateCreate: raw.DATE_CREATE,
      }
    })
    const allCompanies: Company[] = []
    let start = 0
    let hasNext = true
    while (hasNext) {
      const page = await portalCall<Array<{ ID: string | number; TITLE: string }>>('crm.company.list', { select: ['ID', 'TITLE'], order: { TITLE: 'ASC' }, start })
      allCompanies.push(...page.map((company) => ({ id: Number(company.ID), title: company.TITLE })))
      hasNext = page.length === 50
      if (hasNext) start += page.length
    }
    companies.value = allCompanies
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось загрузить данные портала'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    b24.value = await initializeB24Frame()
    await loadPortalData()
  } catch {
    // Outside the Bitrix24 iframe the app stays in demo mode.
  }
})

async function openCreate() {
  title.value = ''
  amount.value = null
  selectedCompanyId.value = undefined
  companySearch.value = ''
  companyMenuOpen.value = false
  notice.value = ''
  modalOpen.value = true
  if (b24.value && companies.value.length === 0) await loadPortalData()
}

async function createDeal() {
  if (!title.value.trim()) return
  saving.value = true
  error.value = ''
  try {
    const company = selectedCompany.value
    if (b24.value) {
      const created = await portalCall<{ item?: { id: number; title: string; companyId?: number; opportunity?: number; stageName?: string } }>('crm.item.add', {
        entityTypeId: 2,
        fields: {
          title: title.value.trim(),
          opportunity: Number(amount.value ?? 0),
          currencyId: 'RUB',
          ...(company ? { companyId: company.id } : {}),
        },
      })
      const item = created?.item
      if (item) {
        deals.value = [{ ...item, companyId: Number(item.companyId ?? company?.id), companyTitle: company?.title ?? item.companyTitle }, ...deals.value]
      }
    } else {
      deals.value = [{
        id: Date.now(), title: title.value.trim(), opportunity: Number(amount.value ?? 0),
        ...(company ? { companyId: company.id, companyTitle: company.title } : {}), stageName: 'Новая',
      }, ...deals.value]
    }
    modalOpen.value = false
    notice.value = 'Сделка создана' + (company ? ` и привязана к компании «${company.title}».` : '.')
    if (b24.value) void loadPortalData()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Не удалось создать сделку'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="Рабочее место"><span class="brand-mark">b</span><span>Рабочее место</span></a>
      <div class="portal-state"><i></i>{{ b24 ? 'Подключено к порталу' : 'Демо-режим' }}</div>
    </header>

    <div class="workspace">
      <aside class="sidebar">
        <div class="side-caption">РАБОЧАЯ ОБЛАСТЬ</div>
        <a href="#">⌂ <span>Обзор</span></a>
        <a class="active" href="#">▤ <span>Сделки</span><b>{{ deals.length }}</b></a>
        <a href="#">♙ <span>Контакты</span></a>
        <a href="#">▦ <span>Компании</span></a>
        <a href="#">✓ <span>Задачи</span></a>
        <div class="profile"><span class="avatar">AI</span><div><b>Учебный проект</b><small>{{ b24 ? 'CRM Bitrix24' : 'Предпросмотр' }}</small></div></div>
      </aside>

      <section class="content">
        <div class="breadcrumbs">CRM <span>/</span> Сделки</div>
        <div class="title-row">
          <div><div class="eyebrow">CRM / ВОРОНКА ПРОДАЖ</div><h1>Сделки</h1><p>Следите за продажами и ведите работу с клиентами.</p></div>
          <button class="primary" @click="openCreate"><span>＋</span> Создать сделку</button>
        </div>

        <div class="stats">
          <article class="stat"><span>Всего сделок</span><b>{{ deals.length }}</b><small>Актуальная информация по воронке</small></article>
          <article class="stat"><span>В работе</span><b>{{ deals.filter((d) => d.stageName !== 'Новая').length }}</b><small>Активные возможности</small></article>
          <article class="stat"><span>Сумма сделок</span><b>{{ money(totalAmount) }}</b><small>Общая сумма в списке</small></article>
          <article class="stat"><span>Компании</span><b>{{ companies.length }}</b><small>Доступно для привязки</small></article>
        </div>

        <section class="deal-panel">
          <div class="panel-heading"><div><h2>Все сделки</h2><p>Актуальная информация по воронке</p></div>
            <label class="search"><span>⌕</span><input v-model="search" placeholder="Поиск по сделкам"></label>
            <button class="icon-button" aria-label="Обновить список" title="Обновить список" @click="loadPortalData">↻</button>
          </div>
          <div class="table-scroll"><table><thead><tr><th class="check-cell"><input type="checkbox" aria-label="Выбрать все"></th><th>НАЗВАНИЕ СДЕЛКИ</th><th>КОМПАНИЯ</th><th>СУММА</th><th>СТАДИЯ</th><th>СОЗДАНА</th></tr></thead>
            <tbody><tr v-for="deal in filteredDeals" :key="deal.id"><td><input type="checkbox" :aria-label="`Выбрать ${deal.title}`"></td><td class="deal-name">{{ deal.title }}</td><td>{{ deal.companyTitle || '—' }}</td><td>{{ money(Number(deal.opportunity ?? 0)) }}</td><td><span class="stage">{{ deal.stageName || 'Новая' }}</span></td><td>{{ date(deal.dateCreate) }}</td></tr>
              <tr v-if="!filteredDeals.length"><td colspan="6" class="empty">{{ loading ? 'Загружаем сделки…' : 'Сделок пока нет. Создайте первую сделку.' }}</td></tr></tbody></table></div>
          <div class="panel-footer"><span>Показано {{ filteredDeals.length }} из {{ deals.length }} сделок</span><div class="pagination"><button disabled>‹</button><button class="selected">1</button><button>›</button></div></div>
        </section>
        <div v-if="notice" class="notice">✓ {{ notice }} <button @click="notice = ''">×</button></div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <div class="learning-note"><span class="sparkle">✦</span><div><b>Учебный проект на Bitrix24 UI</b><small>Интерфейс собран из Vue-компонентов. В портале сделки и компании загружаются через REST API.</small></div><button @click="loadPortalData">Обновить данные</button></div>
      </section>
    </div>

    <div v-if="modalOpen" class="modal-backdrop" @click.self="modalOpen = false">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header"><div><div class="eyebrow">НОВАЯ ЗАПИСЬ В CRM</div><h2 id="modal-title">Создать сделку</h2></div><button class="close-button" aria-label="Закрыть" @click="modalOpen = false">×</button></div>
        <form @submit.prevent="createDeal">
          <label class="field-label" for="deal-title">Название сделки <span>*</span></label><input id="deal-title" v-model="title" class="text-input" placeholder="Например, поставка оборудования" required autofocus>
          <label class="field-label" for="deal-amount">Сумма, ₽</label><input id="deal-amount" v-model.number="amount" class="text-input" type="number" min="0" placeholder="0">
          <label class="field-label" for="company-search">Компания</label>
          <div class="company-select">
            <button id="company-search" type="button" class="company-trigger" :aria-expanded="companyMenuOpen" @click="companyMenuOpen = !companyMenuOpen">
              <span :class="{ muted: !selectedCompany }">{{ selectedCompany?.title || 'Выберите компанию' }}</span><span class="company-caret">{{ companyMenuOpen ? '⌃' : '⌄' }}</span>
            </button>
            <div v-if="companyMenuOpen" class="company-dropdown">
              <input v-model="companySearch" class="company-search-input" placeholder="Поиск компании…" autofocus>
              <button v-for="company in filteredCompanies" :key="company.id" type="button" class="company-option" :class="{ chosen: company.id === Number(selectedCompanyId) }" @click="selectedCompanyId = company.id; companyMenuOpen = false; companySearch = ''">
                <span>{{ company.title }}</span><span v-if="company.id === Number(selectedCompanyId)" class="option-check">✓</span>
              </button>
              <p v-if="!filteredCompanies.length" class="company-empty">{{ loading ? 'Загружаем компании…' : 'Компании не найдены' }}</p>
            </div>
          </div>
          <p class="field-hint">Сделка будет связана с выбранной компанией в CRM.</p>
          <div v-if="error" class="error-message form-error">{{ error }}</div>
          <div class="modal-actions"><button type="button" class="secondary" @click="modalOpen = false">Отмена</button><button class="primary" type="submit" :disabled="saving || !title.trim()">{{ saving ? 'Сохраняем…' : 'Создать сделку' }}</button></div>
        </form>
      </section>
    </div>
  </main>
</template>
