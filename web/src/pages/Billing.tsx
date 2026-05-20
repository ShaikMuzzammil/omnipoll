import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Billing() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/dashboard/settings", { replace: true });
  }, [navigate]);
  return null;
}
