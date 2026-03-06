import { useState, useEffect } from "react";
import { maskPhone } from "../../../utils/masks";

interface CountryCode {
  code: string;
  label: string;
}

interface PhoneInputProps {
  countries: CountryCode[];
  placeholder?: string;
  onChange?: (phoneNumber: string) => void;
  selectPosition?: "start" | "end"; // New prop for dropdown position
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  countries,
  placeholder = "(99) 99999-9999",
  onChange,
  selectPosition = "start", // Default position is 'start'
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>("BR");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const countryCodes: Record<string, string> = countries.reduce(
    (acc, { code, label }) => ({ ...acc, [code]: label }),
    {}
  );

  // Initialize with BR if available, otherwise first country
  useEffect(() => {
    const initialCountry = countries.find(c => c.code === "BR")?.code || countries[0]?.code || "US";
    setSelectedCountry(initialCountry);
    const code = countryCodes[initialCountry] || "";
    // Only set if phoneNumber is empty to avoid overwriting user input on re-renders if countries change
    // But since we want to initialize, let's check if phoneNumber is empty
    setPhoneNumber(prev => prev || (code ? `${code} ` : ""));
  }, [countries]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setSelectedCountry(newCountry);
    const code = countryCodes[newCountry];
    // Keep existing number if possible? For now, reset to code like original behavior but with space
    const newPhone = code ? `${code} ` : "";
    setPhoneNumber(newPhone);
    if (onChange) {
      onChange(newPhone);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const currentDDI = countryCodes[selectedCountry];

    // Remove all non-digit characters
    const rawDigits = inputValue.replace(/\D/g, "");
    
    // Get numeric DDI (remove +)
    const numericDDI = currentDDI ? currentDDI.replace(/\D/g, "") : "";

    let numberPart = rawDigits;

    // Check if raw digits start with numeric DDI
    // We only strip DDI if we have one and the input actually starts with it
    // This prevents stripping "55" from a phone number "5599..." if the DDI wasn't actually part of the prefix logic
    // But since we force the prefix in the display, it's safer to strip it if present at start
    if (numericDDI && rawDigits.startsWith(numericDDI)) {
      numberPart = rawDigits.substring(numericDDI.length);
    }

    // Apply mask to the number part
    const maskedNumber = maskPhone(numberPart);
    
    // Reconstruct value with DDI
    const finalValue = currentDDI ? `${currentDDI} ${maskedNumber}` : maskedNumber;

    setPhoneNumber(finalValue);
    if (onChange) {
      onChange(finalValue);
    }
  };

  return (
    <div className="relative flex">
      {/* Dropdown position: Start */}
      {selectPosition === "start" && (
        <div className="absolute">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            className="appearance-none bg-none rounded-l-lg border-0 border-r border-gray-200 bg-transparent py-3 pl-3.5 pr-8 leading-tight text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:text-gray-400"
          >
            {countries.map((country) => (
              <option
                key={country.code}
                value={country.code}
                className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
              >
                {country.code}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 flex items-center text-gray-700 pointer-events-none bg-none right-3 dark:text-gray-400">
            <svg
              className="stroke-current"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Input field */}
      <input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        placeholder={placeholder}
        className={`dark:bg-dark-900 h-11 w-full ${
          selectPosition === "start" ? "pl-[84px]" : "pr-[84px]"
        } rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800`}
      />

      {/* Dropdown position: End */}
      {selectPosition === "end" && (
        <div className="absolute right-0">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            className="appearance-none bg-none rounded-r-lg border-0 border-l border-gray-200 bg-transparent py-3 pl-3.5 pr-8 leading-tight text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:text-gray-400"
          >
            {countries.map((country) => (
              <option
                key={country.code}
                value={country.code}
                className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
              >
                {country.code}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 flex items-center text-gray-700 pointer-events-none right-3 dark:text-gray-400">
            <svg
              className="stroke-current"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
