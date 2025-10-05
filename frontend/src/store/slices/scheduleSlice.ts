import { addDays, format, parseISO, startOfWeek } from "date-fns";

export interface ShiftItem {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  isPublished: boolean;
  publishedAt: string | null;
  week?: {
    id: string | null;
    startDate: string;
    endDate: string;
    isPublished: boolean;
    publishedAt: string | null;
  } | null;
}

export interface WeekInfo {
  id: string | null;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  publishedAt: string | null;
}

interface ScheduleState {
  selectedWeekStart: string;
  selectedWeekEnd: string;
  shifts: ShiftItem[];
  weekInfo: WeekInfo | null;
  loading: boolean;
  publishing: boolean;
  error: string | null;
}

const computeWeekRange = (dateString: string) => {
  const parsed = parseISO(dateString);
  const start = startOfWeek(parsed, { weekStartsOn: 1 });
  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(addDays(start, 6), "yyyy-MM-dd"),
  };
};

const initialWeek = computeWeekRange(
  format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
);

const initialState: ScheduleState = {
  selectedWeekStart: initialWeek.start,
  selectedWeekEnd: initialWeek.end,
  shifts: [],
  weekInfo: null,
  loading: false,
  publishing: false,
  error: null,
};

const SET_SELECTED_WEEK = "schedule/SET_SELECTED_WEEK";
const SET_SHIFTS = "schedule/SET_SHIFTS";
const SET_WEEK_INFO = "schedule/SET_WEEK_INFO";
const SET_LOADING = "schedule/SET_LOADING";
const SET_ERROR = "schedule/SET_ERROR";
const SET_PUBLISHING = "schedule/SET_PUBLISHING";
const REMOVE_SHIFT = "schedule/REMOVE_SHIFT";

interface Action {
  type: string;
  payload?: any;
}

export default function scheduleReducer(
  state: ScheduleState = initialState,
  action: Action
): ScheduleState {
  switch (action.type) {
    case SET_SELECTED_WEEK: {
      const { start, end } = computeWeekRange(action.payload);
      return { ...state, selectedWeekStart: start, selectedWeekEnd: end };
    }
    case SET_SHIFTS:
      return { ...state, shifts: action.payload };
    case SET_WEEK_INFO:
      return { ...state, weekInfo: action.payload };
    case SET_LOADING:
      return { ...state, loading: action.payload };
    case SET_ERROR:
      return { ...state, error: action.payload };
    case SET_PUBLISHING:
      return { ...state, publishing: action.payload };
    case REMOVE_SHIFT:
      return {
        ...state,
        shifts: state.shifts.filter((shift) => shift.id !== action.payload),
      };
    default:
      return state;
  }
}

export const setSelectedWeek = (weekStart: string) => ({
  type: SET_SELECTED_WEEK,
  payload: weekStart,
});

export const setShifts = (shifts: ShiftItem[]) => ({
  type: SET_SHIFTS,
  payload: shifts,
});

export const setWeekInfo = (week: WeekInfo | null) => ({
  type: SET_WEEK_INFO,
  payload: week,
});

export const setLoading = (loading: boolean) => ({
  type: SET_LOADING,
  payload: loading,
});

export const setError = (message: string | null) => ({
  type: SET_ERROR,
  payload: message,
});

export const setPublishing = (publishing: boolean) => ({
  type: SET_PUBLISHING,
  payload: publishing,
});

export const removeShift = (id: string) => ({
  type: REMOVE_SHIFT,
  payload: id,
});
