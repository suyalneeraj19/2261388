import { useState, useCallback } from "react";
import { isValidUrl, isValidShortcode } from "../utils/validator";
import { Log } from "../LoggingMiddleware/index";

type UrlInput = {
  longUrl: string;
  validity: string;
  shortcode: string;
};

type Props = {
  onSubmit: (input: UrlInput) => void;
  isLoading?: boolean;
};

export default function UrlForm({ onSubmit, isLoading = false }: Props) {
  const [input, setInput] = useState<UrlInput>({
    longUrl: "",
    validity: "",
    shortcode: "",
  });

  const [errors, setErrors] = useState<Partial<UrlInput>>({});

  const validateInput = useCallback((name: keyof UrlInput, value: string): string => {
    if (name === "longUrl" && value && !isValidUrl(value)) {
      return "Please enter a valid URL starting with http:// or https://";
    }
    if (name === "shortcode" && value && !isValidShortcode(value)) {
      return "Shortcode must be 1-10 alphanumeric characters";
    }
    if (name === "validity" && value) {
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > 1440) {
        return "Validity must be between 1 and 1440 minutes";
      }
    }
    return "";
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof UrlInput]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  }, [errors]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateInput(name as keyof UrlInput, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateInput]);

  const handleSubmit = useCallback(() => {
    // Validate all fields
    const newErrors: Partial<UrlInput> = {};
    let hasErrors = false;

    if (!input.longUrl.trim()) {
      newErrors.longUrl = "URL is required";
      hasErrors = true;
    } else if (!isValidUrl(input.longUrl)) {
      newErrors.longUrl = "Please enter a valid URL";
      hasErrors = true;
    }

    if (input.shortcode && !isValidShortcode(input.shortcode)) {
      newErrors.shortcode = "Invalid shortcode format";
      hasErrors = true;
    }

    if (input.validity) {
      const num = parseInt(input.validity);
      if (isNaN(num) || num < 1 || num > 1440) {
        newErrors.validity = "Validity must be between 1 and 1440 minutes";
        hasErrors = true;
      }
    }

    setErrors(newErrors);

    if (hasErrors) {
      Log("frontend", "error", "component", "Form validation failed").catch(console.warn);
      return;
    }

    const validity = input.validity.trim() === "" ? "30" : input.validity;
    onSubmit({ ...input, validity });
  }, [input, onSubmit]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="url-form">
      <div className="form-group">
        <input
          name="longUrl"
          placeholder="Enter long URL"
          value={input.longUrl}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          className={errors.longUrl ? "error" : ""}
        />
        {errors.longUrl && <span className="error-message">{errors.longUrl}</span>}
      </div>
      
      <div className="form-group">
        <input
          name="validity"
          placeholder="Validity (minutes, default: 30)"
          value={input.validity}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          type="number"
          min="1"
          max="1440"
          className={errors.validity ? "error" : ""}
        />
        {errors.validity && <span className="error-message">{errors.validity}</span>}
      </div>
      
      <div className="form-group">
        <input
          name="shortcode"
          placeholder="Custom shortcode (optional)"
          value={input.shortcode}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          className={errors.shortcode ? "error" : ""}
        />
        {errors.shortcode && <span className="error-message">{errors.shortcode}</span>}
      </div>
      
      <button 
        onClick={handleSubmit} 
        disabled={isLoading}
        className="submit-btn"
      >
        {isLoading ? "Shortening..." : "Shorten"}
      </button>
    </div>
  );
}
