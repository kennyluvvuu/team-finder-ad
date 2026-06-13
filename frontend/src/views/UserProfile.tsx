import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  User as UserIcon,
  Mail,
  Phone,
  Loader2,
  Lock,
  Camera,
  AlertCircle,
  CheckCircle2,
  LogOut,
  FolderKanban,
} from "lucide-react";
import { Github } from "../components/icons/Github";

// Zod schemas
const profileSchema = z.object({
  name: z.string().min(1, "Имя обязательно").max(124, "Не более 124 символов"),
  surname: z
    .string()
    .min(1, "Фамилия обязательна")
    .max(124, "Не более 124 символов"),
  phone: z
    .string()
    .min(1, "Номер телефона обязателен")
    .max(12, "Не более 12 символов"),
  github_url: z
    .string()
    .url("Некорректный URL (должен начинаться с http:// или https://)")
    .or(z.literal(""))
    .optional(),
  about: z.string().max(256, "О себе — не более 256 символов").optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    old_password: z.string().min(1, "Введите старый пароль"),
    new_password1: z
      .string()
      .min(6, "Новый пароль должен быть не менее 6 символов"),
    new_password2: z.string().min(6, "Повторите новый пароль"),
  })
  .refine((data) => data.new_password1 === data.new_password2, {
    message: "Новые пароли не совпадают",
    path: ["new_password2"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export function UserProfile() {
  const { id } = useParams<{ id?: string }>();
  const isOwnProfile = !id; // no id parameter in route implies /profile
  const userId = id ? parseInt(id, 10) : null;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser, logout } = useAuth();

  // Active Tab: 'info' | 'edit' | 'password'
  const [activeTab, setActiveTab] = useState<"info" | "edit" | "password">(
    "info",
  );

  // Notifications
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Forms states
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: "",
    surname: "",
    phone: "",
    github_url: "",
    about: "",
  });
  const [profileErrors, setProfileErrors] = useState<Partial<ProfileForm>>({});

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    old_password: "",
    new_password1: "",
    new_password2: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Partial<PasswordForm>>(
    {},
  );

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Fetch target profile (public or own)
  const {
    data: profileUser,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["user", userId || "own"],
    queryFn: () => (userId ? api.getUser(userId) : api.getProfile()),
    retry: false,
    enabled: isOwnProfile ? !!currentUser : userId !== null && userId > 0,
  });

  // Prefill forms when data is loaded
  useEffect(() => {
    if (profileUser) {
      setProfileForm({
        name: profileUser.name || "",
        surname: profileUser.surname || "",
        phone: profileUser.phone || "",
        github_url: profileUser.github_url || "",
        about: profileUser.about || "",
      });
      setAvatarPreview(profileUser.avatar || null);
    }
  }, [profileUser]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["user", "own"], updatedUser);
      queryClient.setQueryData(["profile"], updatedUser); // sync current session user
      queryClient.invalidateQueries();
      setSuccessMsg("Профиль успешно обновлен!");
      setSelectedFile(null);
      setProfileErrors({});
      setErrorMsg("");
      setActiveTab("info");
      window.scrollTo(0, 0);
    },
    onError: (err: any) => {
      setErrorMsg(err?.message || "Не удалось обновить профиль");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: api.changePassword,
    onSuccess: () => {
      setSuccessMsg("Пароль успешно изменен!");
      setPasswordForm({
        old_password: "",
        new_password1: "",
        new_password2: "",
      });
      setPasswordErrors({});
      setErrorMsg("");
      setActiveTab("info");
      window.scrollTo(0, 0);
    },
    onError: (err: any) => {
      if (err?.data && typeof err.data === "object") {
        setPasswordErrors(err.data);
      } else {
        setErrorMsg(err?.message || "Ошибка при смене пароля");
      }
    },
  });

  if (isOwnProfile && !currentUser) {
    return (
      <div className="container mx-auto px-4 py-12 text-center max-w-md">
        <Card className="border-border bg-card p-8">
          <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Требуется авторизация</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Пожалуйста, войдите в свой аккаунт, чтобы просмотреть настройки
            профиля.
          </p>
          <Button onClick={() => navigate("/login")} className="w-full">
            Войти
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
        <span className="text-muted-foreground text-sm font-medium">
          Загрузка профиля...
        </span>
      </div>
    );
  }

  if (isError || !profileUser) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <div className="flex items-center gap-2 rounded-none bg-destructive/10 border border-destructive/30 p-4 text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-semibold">Профиль не найден</h4>
            <p className="text-sm">
              {error?.message || "Такого пользователя не существует."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const result = profileSchema.safeParse(profileForm);
    if (!result.success) {
      const errors: Partial<ProfileForm> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof ProfileForm] = err.message;
        }
      });
      setProfileErrors(errors);
      return;
    }

    // Use FormData if there is a file selected
    if (selectedFile) {
      const formData = new FormData();
      formData.append("name", profileForm.name);
      formData.append("surname", profileForm.surname);
      formData.append("phone", profileForm.phone);
      if (profileForm.github_url)
        formData.append("github_url", profileForm.github_url);
      if (profileForm.about) formData.append("about", profileForm.about);
      formData.append("avatar", selectedFile);

      updateProfileMutation.mutate(formData);
    } else {
      updateProfileMutation.mutate(profileForm);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const result = passwordSchema.safeParse(passwordForm);
    if (!result.success) {
      const errors: Partial<PasswordForm> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof PasswordForm] = err.message;
        }
      });
      setPasswordErrors(errors);
      return;
    }

    changePasswordMutation.mutate(passwordForm);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Preview locally
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getUserInitials = () => {
    return `${profileUser.name[0] || ""}${profileUser.surname[0] || ""}`.toUpperCase();
  };

  const isRealOwnProfile = currentUser
    ? profileUser.id === currentUser.id
    : false;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Alert Banners */}
      {successMsg && (
        <Alert className="mb-6">
          <CheckCircle2 className="w-4 h-4" />
          <AlertTitle>Успешно</AlertTitle>
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}
      {errorMsg && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as any)}
        className="w-full"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Side: Avatar Card */}
          <div className="md:col-span-1 space-y-6 md:sticky md:top-24 self-start">
            <Card className="border bg-card text-center p-6 relative overflow-hidden">
              {/* Avatar block */}
              <div className="relative inline-block mx-auto mt-4 mb-4">
                <Avatar className="h-28 w-28 border-4">
                  <AvatarImage
                    src={avatarPreview || undefined}
                    alt={profileUser.name}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-3xl">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>

                {/* Edit Mode Avatar Overlay */}
                {isRealOwnProfile && activeTab === "edit" && (
                  <label
                    htmlFor="avatar-input"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-none border border-background bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center cursor-pointer shadow-xs transition-transform hover:scale-105"
                    title="Изменить аватар"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      id="avatar-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <h2 className="text-xl font-bold text-foreground">
                {profileUser.name} {profileUser.surname}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {profileUser.email}
              </p>

              {/* Profile Navigation (Own profile only) */}
              {isRealOwnProfile && (
                <TabsList className="flex flex-col gap-1.5 mt-8 border-t pt-6 bg-transparent h-auto w-full items-stretch">
                  <TabsTrigger
                    value="info"
                    className="w-full justify-start font-semibold text-sm px-3 py-2"
                  >
                    <UserIcon className="w-4 h-4 mr-2" />
                    Просмотр профиля
                  </TabsTrigger>

                  <TabsTrigger
                    value="edit"
                    className="w-full justify-start font-semibold text-sm px-3 py-2"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Редактировать
                  </TabsTrigger>

                  <TabsTrigger
                    value="password"
                    className="w-full justify-start font-semibold text-sm px-3 py-2"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Сменить пароль
                  </TabsTrigger>

                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start font-semibold text-sm text-destructive hover:bg-destructive/10 hover:text-destructive mt-4 border-t pt-4"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Выйти из аккаунта
                  </Button>
                </TabsList>
              )}
            </Card>
          </div>

          {/* Right Side: Tab Contents */}
          <div className="md:col-span-2 space-y-6">
            {/* Tab 1: Profile View Info */}
            <TabsContent value="info" className="m-0 space-y-6 outline-none">
              <Card className="border border-border/60 bg-card p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xl font-bold tracking-tight mb-2">
                    О себе
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {profileUser.about || "Информация отсутствует."}
                  </p>
                </div>

                <div className="border-t border-border/50 pt-6 space-y-4">
                  <h3 className="text-lg font-bold tracking-tight">
                    Контактная информация
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Email */}
                    <div className="flex items-center gap-3 p-3 rounded-none border bg-muted/10">
                      <Mail className="w-5 h-5 text-primary shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          Email
                        </span>
                        <a
                          href={`mailto:${profileUser.email}`}
                          className="text-sm font-semibold hover:underline block truncate"
                        >
                          {profileUser.email}
                        </a>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-3 p-3 rounded-none border bg-muted/10">
                      <Phone className="w-5 h-5 text-primary shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          Телефон
                        </span>
                        <span className="text-sm font-semibold block">
                          {profileUser.phone || "Не указан"}
                        </span>
                      </div>
                    </div>

                    {/* GitHub */}
                    {profileUser.github_url && (
                      <div className="flex items-center gap-3 p-3 rounded-none border bg-muted/10 sm:col-span-2">
                        <Github className="w-5 h-5 text-primary shrink-0" />
                        <div className="overflow-hidden">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                            GitHub профиль
                          </span>
                          <a
                            href={profileUser.github_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-primary hover:underline truncate block"
                          >
                            {profileUser.github_url}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Tab 2: Edit Profile (Own Profile only) */}
            {isRealOwnProfile && (
              <TabsContent value="edit" className="m-0 outline-none">
                <Card className="border border-border/60 bg-card p-6 sm:p-8 shadow-sm">
                  <div className="border-b border-border/50 pb-4 mb-6">
                    <CardTitle className="text-xl font-bold">
                      Редактировать профиль
                    </CardTitle>
                    <CardDescription>
                      Измените свои персональные данные и контактную информацию
                    </CardDescription>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    {/* Name & Surname Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Имя *</Label>
                        <Input
                          id="name"
                          value={profileForm.name}
                          onChange={(e) => {
                            setProfileForm((p) => ({
                              ...p,
                              name: e.target.value,
                            }));
                            setProfileErrors((p) => ({
                              ...p,
                              name: undefined,
                            }));
                          }}
                          disabled={updateProfileMutation.isPending}
                        />
                        {profileErrors.name && (
                          <p className="text-xs font-semibold text-destructive">
                            {profileErrors.name}
                          </p>
                        )}
                      </div>

                      {/* Surname */}
                      <div className="space-y-1.5">
                        <Label htmlFor="surname">Фамилия *</Label>
                        <Input
                          id="surname"
                          value={profileForm.surname}
                          onChange={(e) => {
                            setProfileForm((p) => ({
                              ...p,
                              surname: e.target.value,
                            }));
                            setProfileErrors((p) => ({
                              ...p,
                              surname: undefined,
                            }));
                          }}
                          disabled={updateProfileMutation.isPending}
                        />
                        {profileErrors.surname && (
                          <p className="text-xs font-semibold text-destructive">
                            {profileErrors.surname}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Номер телефона *</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) => {
                          setProfileForm((p) => ({
                            ...p,
                            phone: e.target.value,
                          }));
                          setProfileErrors((p) => ({ ...p, phone: undefined }));
                        }}
                        disabled={updateProfileMutation.isPending}
                      />
                      {profileErrors.phone && (
                        <p className="text-xs font-semibold text-destructive">
                          {profileErrors.phone}
                        </p>
                      )}
                    </div>

                    {/* GitHub URL */}
                    <div className="space-y-1.5">
                      <Label htmlFor="github_url">
                        Ссылка на GitHub профиль
                      </Label>
                      <div className="relative">
                        <Github className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                        <Input
                          id="github_url"
                          placeholder="https://github.com/username"
                          className="pl-10"
                          value={profileForm.github_url}
                          onChange={(e) => {
                            setProfileForm((p) => ({
                              ...p,
                              github_url: e.target.value,
                            }));
                            setProfileErrors((p) => ({
                              ...p,
                              github_url: undefined,
                            }));
                          }}
                          disabled={updateProfileMutation.isPending}
                        />
                      </div>
                      {profileErrors.github_url && (
                        <p className="text-xs font-semibold text-destructive">
                          {profileErrors.github_url}
                        </p>
                      )}
                    </div>

                    {/* About me */}
                    <div className="space-y-1.5">
                      <Label htmlFor="about">О себе (макс. 256 символов)</Label>
                      <Textarea
                        id="about"
                        className="min-h-[100px] resize-y"
                        value={profileForm.about}
                        onChange={(e) => {
                          setProfileForm((p) => ({
                            ...p,
                            about: e.target.value,
                          }));
                          setProfileErrors((p) => ({ ...p, about: undefined }));
                        }}
                        disabled={updateProfileMutation.isPending}
                      />
                      {profileErrors.about && (
                        <p className="text-xs font-semibold text-destructive">
                          {profileErrors.about}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-border/50 pt-4 mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("info")}
                        disabled={updateProfileMutation.isPending}
                      >
                        Отмена
                      </Button>
                      <Button
                        type="submit"
                        className="font-semibold"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                            Сохранение...
                          </>
                        ) : (
                          "Сохранить изменения"
                        )}
                      </Button>
                    </div>
                  </form>
                </Card>
              </TabsContent>
            )}

            {/* Tab 3: Change Password (Own Profile only) */}
            {isRealOwnProfile && (
              <TabsContent value="password" className="m-0 outline-none">
                <Card className="border border-border/60 bg-card p-6 sm:p-8 shadow-sm">
                  <div className="border-b border-border/50 pb-4 mb-6">
                    <CardTitle className="text-xl font-bold">
                      Смена пароля
                    </CardTitle>
                    <CardDescription>
                      Измените текущий пароль на новый. Пароль должен быть
                      надежным
                    </CardDescription>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {/* Old Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="old_password">Текущий пароль *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                        <Input
                          id="old_password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          value={passwordForm.old_password}
                          onChange={(e) => {
                            setPasswordForm((p) => ({
                              ...p,
                              old_password: e.target.value,
                            }));
                            setPasswordErrors((p) => ({
                              ...p,
                              old_password: undefined,
                            }));
                          }}
                          disabled={changePasswordMutation.isPending}
                        />
                      </div>
                      {passwordErrors.old_password && (
                        <p className="text-xs font-semibold text-destructive">
                          {passwordErrors.old_password}
                        </p>
                      )}
                    </div>

                    {/* New Password 1 */}
                    <div className="space-y-1.5">
                      <Label htmlFor="new_password1">Новый пароль *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                        <Input
                          id="new_password1"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          value={passwordForm.new_password1}
                          onChange={(e) => {
                            setPasswordForm((p) => ({
                              ...p,
                              new_password1: e.target.value,
                            }));
                            setPasswordErrors((p) => ({
                              ...p,
                              new_password1: undefined,
                            }));
                          }}
                          disabled={changePasswordMutation.isPending}
                        />
                      </div>
                      {passwordErrors.new_password1 && (
                        <p className="text-xs font-semibold text-destructive">
                          {passwordErrors.new_password1}
                        </p>
                      )}
                    </div>

                    {/* New Password 2 */}
                    <div className="space-y-1.5">
                      <Label htmlFor="new_password2">
                        Повторите новый пароль *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
                        <Input
                          id="new_password2"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          value={passwordForm.new_password2}
                          onChange={(e) => {
                            setPasswordForm((p) => ({
                              ...p,
                              new_password2: e.target.value,
                            }));
                            setPasswordErrors((p) => ({
                              ...p,
                              new_password2: undefined,
                            }));
                          }}
                          disabled={changePasswordMutation.isPending}
                        />
                      </div>
                      {passwordErrors.new_password2 && (
                        <p className="text-xs font-semibold text-destructive">
                          {passwordErrors.new_password2}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-border/50 pt-4 mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("info")}
                        disabled={changePasswordMutation.isPending}
                      >
                        Отмена
                      </Button>
                      <Button
                        type="submit"
                        className="font-semibold"
                        disabled={changePasswordMutation.isPending}
                      >
                        {changePasswordMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                            Смена...
                          </>
                        ) : (
                          "Изменить пароль"
                        )}
                      </Button>
                    </div>
                  </form>
                </Card>
              </TabsContent>
            )}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
