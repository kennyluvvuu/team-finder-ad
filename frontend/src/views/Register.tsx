import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { z } from "zod";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
  UserPlus,
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  AlertCircle,
} from "lucide-react";

const registerSchema = z.object({
  email: z
    .string()
    .min(1, "E-mail обязателен для заполнения")
    .email("Некорректный формат e-mail"),
  name: z.string().min(1, "Имя обязательно").max(124, "Максимум 124 символа"),
  surname: z
    .string()
    .min(1, "Фамилия обязательна")
    .max(124, "Максимум 124 символа"),
  phone: z
    .string()
    .min(1, "Номер телефона обязателен")
    .max(12, "Максимум 12 символов (например, +79991234567)"),
  password: z.string().min(6, "Пароль должен содержать не менее 6 символов"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterForm>({
    email: "",
    name: "",
    surname: "",
    phone: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<RegisterForm>>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof RegisterForm]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setApiError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<RegisterForm> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof RegisterForm] = err.message;
        }
      });
      setFormErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await register(formData);
      navigate("/projects");
    } catch (err: any) {
      console.error(err);
      if (err?.data) {
        // Display specific field validation errors from backend
        const keys = Object.keys(err.data);
        const firstKey = keys[0];
        if (firstKey !== undefined) {
          const errorMsg = Array.isArray(err.data[firstKey])
            ? err.data[firstKey][0]
            : err.data[firstKey];
          setApiError(`${firstKey}: ${errorMsg}`);
        } else {
          setApiError(
            "Ошибка регистрации. Возможно, этот E-mail уже используется.",
          );
        }
      } else {
        setApiError(err?.message || "Ошибка при регистрации");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[85vh] px-4 py-8">
      <Card className="w-full max-w-lg shadow-lg border">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Регистрация
          </CardTitle>
          <CardDescription>
            Создайте учетную запись для поиска проектов и формирования команд
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <CardContent className="space-y-4">
            {apiError && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Электронная почта *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.email && (
                <p className="text-xs font-semibold text-destructive">
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Name & Surname Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Имя *</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Иван"
                    className="pl-10"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>
                {formErrors.name && (
                  <p className="text-xs font-semibold text-destructive">
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Surname */}
              <div className="space-y-1.5">
                <Label htmlFor="surname">Фамилия *</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    id="surname"
                    name="surname"
                    type="text"
                    placeholder="Иванов"
                    className="pl-10"
                    value={formData.surname}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>
                {formErrors.surname && (
                  <p className="text-xs font-semibold text-destructive">
                    {formErrors.surname}
                  </p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">Номер телефона *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="text"
                  placeholder="+79991234567"
                  className="pl-10"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.phone && (
                <p className="text-xs font-semibold text-destructive">
                  {formErrors.phone}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Пароль *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.password && (
                <p className="text-xs font-semibold text-destructive">
                  {formErrors.password}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Регистрация...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Зарегистрироваться
                </>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link
                to="/login"
                className="font-bold text-primary hover:underline underline-offset-4"
              >
                Войти
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
