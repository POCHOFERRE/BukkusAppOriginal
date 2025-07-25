import React, { useState, useEffect } from "react";
import Billetera from "../components/Billetera";

export default function BilleteraPage() {
  const [saldoTrueKoins, setSaldoTrueKoins] = useState(0);
  const [movimientos, setMovimientos] = useState([]);

  useEffect(() => {
    // Initialize with default values
    setSaldoTrueKoins(0);
    setMovimientos([]);
  }, []);

  return (
    <div className="p-4">
      <Billetera 
        saldo={saldoTrueKoins} 
        movimientos={movimientos} 
      />
    </div>
  );
}
