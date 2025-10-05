import { getAxiosInstance } from ".";

interface ShiftQuery {
  weekStartDate?: string;
}

export const getShifts = async (params?: ShiftQuery) => {
  const api = getAxiosInstance();
  const searchParams = new URLSearchParams();

  if (params?.weekStartDate) {
    searchParams.append("weekStartDate", params.weekStartDate);
  }

  const queryString = searchParams.toString();
  const { data } = await api.get(`/shifts${queryString ? `?${queryString}` : ""}`);
  return data;
};

export const getShiftById = async (id: string) => {
  const api = getAxiosInstance();
  const { data } = await api.get(`/shifts/${id}`);
  return data;
};

export const createShifts = async (payload: any) => {
  const api = getAxiosInstance();
  const { data } = await api.post("/shifts", payload);
  return data;
};

export const updateShiftById = async (id: string, payload: any) => {
  const api = getAxiosInstance();
  const { data } = await api.patch(`/shifts/${id}`, payload);
  return data;
};

export const deleteShiftById = async (id: string) => {
  const api = getAxiosInstance();
  const { data } = await api.delete(`/shifts/${id}`);
  return data;
};

export const getWeekByStart = async (weekStartDate: string) => {
  const api = getAxiosInstance();
  const { data } = await api.get(`/weeks/${weekStartDate}`);
  return data;
};

export const publishWeek = async (weekStartDate: string) => {
  const api = getAxiosInstance();
  const { data } = await api.post(`/weeks/${weekStartDate}/publish`);
  return data;
};
