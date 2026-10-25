import { useState } from "react";
import { LuEye, LuEyeOff } from "react-icons/lu";

const PasswordInput = ({ name, value, onChange, placeholder, required = true }) => {
  const [isShowPassword, setIsShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setIsShowPassword((prev) => !prev);
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={isShowPassword ? "text" : "password"}
        placeholder={placeholder || "Enter password"}
        required={required}
        className="w-full text-sm text-slate-800 bg-white border border-slate-300 rounded-lg px-4 py-2.5 pr-11 outline-none transition-all duration-150 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
      />
      <button
        type="button"
        aria-label={isShowPassword ? "Hide password" : "Show password"}
        onClick={toggleShowPassword}
        className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:text-blue-600 transition-colors"
      >
        {isShowPassword ? (
          <LuEyeOff size={18} />
        ) : (
          <LuEye size={18} />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;

