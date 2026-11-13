import { Routes, Route, Navigate } from "react-router-dom";
import MemberList from "./MemberList";

export default function Members() {
  return (
    <Routes>
      <Route index element={<MemberList />} />
      <Route path="*" element={<Navigate to="/members" replace />} />
    </Routes>
  );
}
