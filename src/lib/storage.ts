// Local storage utility for POS system
export class LocalStorage {
  // Save data to localStorage
  static save<T>(key: string, data: T): T {
    try {
      const existingData = JSON.parse(localStorage.getItem(key) || '[]');
      let updatedData;

      if (Array.isArray(existingData)) {
        updatedData = [...existingData, data];
      } else {
        updatedData = data;
      }

      localStorage.setItem(key, JSON.stringify(Array.isArray(existingData) ? updatedData : data));
      return data;
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
      return data;
    }
  }

  // Load data from localStorage
  static load<T>(key: string): T[] {
    try {
      const localData = localStorage.getItem(key);
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error(`Error loading from localStorage:`, error);
      return [];
    }
  }

  // Delete item from localStorage
  static delete(key: string, id: string, idField: string = 'id'): void {
    try {
      const existingData = JSON.parse(localStorage.getItem(key) || '[]');
      const updatedData = existingData.filter((item: any) => item[idField] !== id);
      localStorage.setItem(key, JSON.stringify(updatedData));
    } catch (error) {
      console.error(`Error deleting from localStorage:`, error);
    }
  }

  // Update item in localStorage
  static update<T>(key: string, id: string, updates: Partial<T>, idField: string = 'id'): T | null {
    try {
      const existingData = JSON.parse(localStorage.getItem(key) || '[]');
      const index = existingData.findIndex((item: any) => item[idField] === id);
      
      if (index >= 0) {
        existingData[index] = { ...existingData[index], ...updates };
        localStorage.setItem(key, JSON.stringify(existingData));
        return existingData[index];
      }
      
      return null;
    } catch (error) {
      console.error(`Error updating localStorage:`, error);
      return null;
    }
  }

  // Upsert (update or insert) item in localStorage
  static upsert<T>(key: string, data: T, matchField: string, matchValue: any): T {
    try {
      const existingData = JSON.parse(localStorage.getItem(key) || '[]');
      const index = existingData.findIndex((item: any) => item[matchField] === matchValue);
      
      if (index >= 0) {
        existingData[index] = { ...existingData[index], ...data };
      } else {
        existingData.push(data);
      }
      
      localStorage.setItem(key, JSON.stringify(existingData));
      return data;
    } catch (error) {
      console.error(`Error upserting to localStorage:`, error);
      return data;
    }
  }
}