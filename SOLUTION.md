# Решение тестового задания

## Описание решения

### Архитектурные решения

**1. Read-Through кэширование в памяти**

Контекст задачи:

"Количество операций по выборкам и чтению - очень большое"

"Количество операций по обновлению данных мало"

"Узкое место в производительности - база данных"

**Решение:**
- **Однократная загрузка** всех данных при старте микросервиса через `db.query({type: '...', where: {}})`
- **Хранение в Map<string, Document>** (O(1) доступ по UUID)
- **Все последующие запросы** работают только с RAM (1-10μs вместо 10-100ms БД)

**Производительность:**

Старт: 4 query() × 50ms = 200ms (разово)
Запросы: Map.get() = 0.001ms (миллионы/сек)

**2. Денормализация связей в памяти**

employeeWithCityList() → JOIN city ON employee.cityUuid = 200ms → 0.001ms
employeeWithPositionList() → JOIN position, division = 400ms → 0.002ms

**Lookup-функции выполняют JOIN в памяти:**

const getCityName = (cityUuid: string): string =>
state.cities.get(cityUuid)?.name ?? 'Неизвестный город';

**3. Структура документов в документо-ориентированной БД**

// Фиксированная схема для каждого типа
{
  type: 'employee' | 'city' | 'position' | 'division',
  data: {
    uuid: string,
    name?: string,
    cityUuid?: string,
    divisionUuid?: string,
    positionUuid?: string
  }
}

**4. Типобезопасность**

type DocData<T> = T extends 'city' ? CityDoc
: T extends 'division' ? DivisionDoc
: T extends 'position' ? PositionDoc
: EmployeeDoc;

### Структура кода

HRAppState {
  cities: Map<string, CityDoc>,
  divisions: Map<string, DivisionDoc>,
  positions: Map<string, PositionDoc>,
  employees: Map<string, EmployeeDoc>
}

initData() → асинхронная инициализация при старте
get*Name() → чистые функции денормализации

HRAppState {
  cities: Map<string, CityDoc>,
  divisions: Map<string, DivisionDoc>,
  positions: Map<string, PositionDoc>,
  employees: Map<string, EmployeeDoc>
}

initData() → асинхронная инициализация при старте
get*Name() → чистые функции денормализации


## Изменения при частых обновлениях

**Новый контекст: "редкие операции чтения и на порядок большее количество операций записи"**

**Текущее решение становится антипаттерном** - кэш требует сложной синхронизации.

**Новое решение:**

1. **Прямые запросы к БД без кэша**

employeeWithCityList() {
  const employees = await db.query({type: 'employee', where: {}});
  return employees.items.map(emp => ({
    firstName: emp.data.firstName,
    city: await getCityName(emp.data.cityUuid) // или JOIN в БД
  }));
}

2. **Индексы в документо-ориентированной БД**

db.query({type: 'employee', where: {cityUuid: '...'}}) = O(log N)
db.query({type: 'employee', where: {divisionUuid: '...'}}) = O(log N)

3. **Materialized Views (если БД поддерживает)**

CREATE VIEW employeeWithPositionView AS
SELECT e.firstName, p.name as position, d.name as division
FROM employee e
JOIN position p ON e.positionUuid = p.uuid
JOIN division d ON e.divisionUuid = d.uuid

4. **Batch-операции для обновлений**

bulkUpdate(updates: Array<{type: string, data: object}>)

**Производительность нового решения:**

Чтение: 50ms (БД + индексы)
Запись: 10ms (batch put/post)
Соотношение 1:10 → оптимально


## Контакты

**Fullstack разработчик**  
**Специализация:** TypeScript/Node.js, React, TON Blockchain, микросервисы  

- **Telegram:** @skorobogatyi  
- **GitHub:** github.com/your_profile  
- **Опыт:** более 7 лет  
- **Стек:** React+TypeScript, RN, Node.js, Vite, TON SDK, LLM, MySQL, MongoDB, и ещё много иностранных слов которыми не хочу парить тут :)

**P.S.:**  
Мен Павлодарданмын!
Қазақстанда 27 жыл өмір сүрген :)
