import axios from "axios";

let startLoadingHandler = null;
let stopLoadingHandler = null;

export const registerLoadingHandlers = ({ startLoading, stopLoading }) => {
  startLoadingHandler = startLoading;
  stopLoadingHandler = stopLoading;
};

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

api.interceptors.request.use(
  (config) => {
    if (startLoadingHandler) startLoadingHandler();

    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    if (stopLoadingHandler) stopLoadingHandler();
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (stopLoadingHandler) stopLoadingHandler();
    return response;
  },
  (error) => {
    if (stopLoadingHandler) stopLoadingHandler();
    return Promise.reject(error);
  }
);

export default api;