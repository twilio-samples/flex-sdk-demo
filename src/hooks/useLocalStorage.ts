export const useLocalStorage = () => {
    return {
        getData: <T>(key: string): T | null => {
            const item = localStorage.getItem(key);
            if (!item) return null;
            return JSON.parse(item);
        },
        setData: (key: string, value: unknown) => {
            localStorage.setItem(key, JSON.stringify(value));
        },
        removeData: (key: string) => {
            localStorage.removeItem(key);
        }
    };
};
