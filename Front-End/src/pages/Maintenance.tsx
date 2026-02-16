import { AlertTriangle, Mail, Clock } from "lucide-react";

function Maintenance() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4" style={{ fontFamily: "Lexend, sans-serif" }}>
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 border border-[#E8E8E6] text-center">
          {/* Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-[#E76F51]/10 to-[#E76F51]/5 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-12 h-12 text-[#E76F51]" strokeWidth={1.5} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2C2C2C] mb-4">Under Maintenance</h1>

          {/* Description */}
          <p className="text-lg text-[#6B6B6B] mb-8 leading-relaxed">We're currently performing scheduled maintenance to improve your experience. The platform will be back online shortly.</p>

          {/* Info Cards */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-[#FAFAF8] rounded-xl p-6 border border-[#E8E8E6]">
              <Clock className="w-8 h-8 text-[#7A9D96] mx-auto mb-3" />
              <div className="text-sm font-semibold text-[#2C2C2C] mb-1">Expected Duration</div>
              <div className="text-xs text-[#6B6B6B]">A few minutes</div>
            </div>

            <div className="bg-[#FAFAF8] rounded-xl p-6 border border-[#E8E8E6]">
              <Mail className="w-8 h-8 text-[#7A9D96] mx-auto mb-3" />
              <div className="text-sm font-semibold text-[#2C2C2C] mb-1">Need Help?</div>
              <div className="text-xs text-[#6B6B6B]">support@medicalinterpreter.com</div>
            </div>
          </div>

          {/* Action */}
          <button onClick={() => window.location.reload()} className="bg-gradient-to-r from-[#7A9D96] to-[#6A8D86] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
            Refresh Page
          </button>

          {/* Note */}
          <p className="text-sm text-[#6B6B6B] mt-6">Thank you for your patience!</p>
        </div>
      </div>
    </div>
  );
}

export default Maintenance;
