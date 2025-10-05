import { combineReducers, createStore } from "redux";
import scheduleReducer from "./slices/scheduleSlice";

const rootReducer = combineReducers({
  schedule: scheduleReducer,
});

export const store = createStore(rootReducer);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
