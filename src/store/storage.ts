// src/app/storage.ts

const createLocalStorage = () => {
  return {
    getItem(key: string): Promise<string | null> {
      if (typeof window !== 'undefined') {
        return Promise.resolve(window.localStorage.getItem(key));
      }
      return Promise.resolve(null);
    },
    setItem(key: string, value: string): Promise<void> {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (err) {
          return Promise.reject(err);
        }
      }
      return Promise.resolve();
    },
    removeItem(key: string): Promise<void> {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        return Promise.resolve();
      }
      return Promise.resolve();
    },
  };
};

const storage = createLocalStorage();

export default storage;
