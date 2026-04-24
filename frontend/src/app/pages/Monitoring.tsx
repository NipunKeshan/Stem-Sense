import IrrigationControl from "../components/IrrigationControl";
import ForcastChart from "../components/ForcastChart";

export default function Monitoring() {

  return (
     <div className="min-h-screen flex flex-col gap-6 items-center justify-center text-white p-4">
       <div className="w-full max-w-2xl">
         <IrrigationControl />
        </div>

       <div className="w-full max-w-4xl">
         <ForcastChart />
        </div>
     </div>
  );
}
