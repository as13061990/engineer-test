import { createDb, IDb_Record } from './db';

// Типы документов
interface CityDoc { uuid: string; name: string; }
interface DivisionDoc { uuid: string; name: string; cityUuid: string; }
interface PositionDoc { uuid: string; name: string; }
interface EmployeeDoc { 
  uuid: string; 
  firstName: string; 
  lastName: string; 
  divisionUuid: string; 
  cityUuid: string; 
  positionUuid: string; 
}

// Type guards для безопасного приведения типов
const isCityDoc = (record: IDb_Record): record is IDb_Record & { data: CityDoc } => 
  typeof record.data === 'object' && 
  'uuid' in record.data && typeof record.data.uuid === 'string' &&
  'name' in record.data && typeof record.data.name === 'string';

const isDivisionDoc = (record: IDb_Record): record is IDb_Record & { data: DivisionDoc } => 
  typeof record.data === 'object' && 
  'uuid' in record.data && typeof record.data.uuid === 'string' &&
  'name' in record.data && typeof record.data.name === 'string' &&
  'cityUuid' in record.data && typeof record.data.cityUuid === 'string';

const isPositionDoc = (record: IDb_Record): record is IDb_Record & { data: PositionDoc } => 
  typeof record.data === 'object' && 
  'uuid' in record.data && typeof record.data.uuid === 'string' &&
  'name' in record.data && typeof record.data.name === 'string';

const isEmployeeDoc = (record: IDb_Record): record is IDb_Record & { data: EmployeeDoc } => 
  typeof record.data === 'object' && 
  'uuid' in record.data && typeof record.data.uuid === 'string' &&
  'firstName' in record.data && typeof record.data.firstName === 'string' &&
  'lastName' in record.data && typeof record.data.lastName === 'string' &&
  'divisionUuid' in record.data && typeof record.data.divisionUuid === 'string' &&
  'cityUuid' in record.data && typeof record.data.cityUuid === 'string' &&
  'positionUuid' in record.data && typeof record.data.positionUuid === 'string';

interface HRAppState {
  cities: Map<string, CityDoc>;
  divisions: Map<string, DivisionDoc>;
  positions: Map<string, PositionDoc>;
  employees: Map<string, EmployeeDoc>;
}

export interface IHRApp {
  employeeWithCityList: () => Promise<{ firstName: string; city: string }[]>;
  employeeWithPositionList: () => Promise<{
    firstName: string;
    position: string;
    division: string;
  }[]>;
  update: (args: {
    entity: "employee" | "city" | "position" | "division";
    data: object;
  }) => Promise<void>;
}

export const createHRApp = (): IHRApp => {
  const db = createDb();
  const state: HRAppState = {
    cities: new Map(),
    divisions: new Map(),
    positions: new Map(),
    employees: new Map(),
  };

  // Инициализация с type-safe приведением типов
  const initData = async () => {
    // Города
    const citiesResp = await db.query({ type: 'city', where: {} });
    for (const record of citiesResp.items) {
      if (isCityDoc(record)) {
        state.cities.set(record.data.uuid, record.data);
      }
    }

    // Подразделения
    const divisionsResp = await db.query({ type: 'division', where: {} });
    for (const record of divisionsResp.items) {
      if (isDivisionDoc(record)) {
        state.divisions.set(record.data.uuid, record.data);
      }
    }

    // Должности
    const positionsResp = await db.query({ type: 'position', where: {} });
    for (const record of positionsResp.items) {
      if (isPositionDoc(record)) {
        state.positions.set(record.data.uuid, record.data);
      }
    }

    // Сотрудники
    const employeesResp = await db.query({ type: 'employee', where: {} });
    for (const record of employeesResp.items) {
      if (isEmployeeDoc(record)) {
        state.employees.set(record.data.uuid, record.data);
      }
    }
  };

  initData().catch(console.error);

  const getCityName = (cityUuid: string): string => 
    state.cities.get(cityUuid)?.name ?? 'Неизвестный город';

  const getDivisionName = (divisionUuid: string): string => 
    state.divisions.get(divisionUuid)?.name ?? 'Неизвестное подразделение';

  const getPositionName = (positionUuid: string): string => 
    state.positions.get(positionUuid)?.name ?? 'Неизвестная должность';

  return {
    employeeWithCityList: async () => {
      return Array.from(state.employees.values())
        .map(emp => ({
          firstName: emp.firstName,
          city: getCityName(emp.cityUuid)
        }));
    },

    employeeWithPositionList: async () => {
      return Array.from(state.employees.values())
        .map(emp => ({
          firstName: emp.firstName,
          position: getPositionName(emp.positionUuid),
          division: getDivisionName(emp.divisionUuid)
        }));
    },

    update: async () => {
      // Не требуется имплементация
    },
  };
};
