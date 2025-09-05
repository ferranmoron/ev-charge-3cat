import {useState} from "react";
import {useSupabaseAuth} from "@/hooks/useSupabaseAuth";
import {useAppSettings} from "@/hooks/useAppSettings";
import {useSupabaseChargingPoints} from "@/hooks/useSupabaseChargingPoints";
import {useSupabaseUsers} from "@/hooks/useSupabaseUsers";
import {AdminLogin} from "@/components/AdminLogin";
import {ChargingPointGrid} from "@/components/ChargingPointGrid";
import {WaitingList} from "@/components/WaitingList";
import {UserForm} from "@/components/UserForm";
import {AdminPanel} from "@/components/AdminPanel";
import {PublicWaitingList} from "@/components/PublicWaitingList";
import {AdminManagement} from "@/components/AdminManagement";
import {SettingsPanel} from "@/components/SettingsPanel";
import {OnlineUsers} from "@/components/OnlineUsers";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
    Zap,
    Users,
    Settings,
    Eye,
    Shield,
    LogOut,
    Clock,
    User,
    Wifi,
    Database,
} from "lucide-react";
import {toast} from "sonner";

export default function Index() {
    const {
        currentUser,
        administrators,
        isLoggedIn,
        isAdmin,
        loading: authLoading,
        login,
        logout,
        addAdministrator,
        removeAdministrator,
        resetPassword,
        getDefaultAdminCredentials,
    } = useSupabaseAuth();

    const {settings, updateMaxChargingHours, toggleEmailNotifications} =
        useAppSettings();

    const {
        users,
        currentUserId,
        loading: usersLoading,
        addOrUpdateUser,
        updateUserChargingPoint,
        getCurrentUser,
        getOnlineUsers,
        isValidUser,
    } = useSupabaseUsers();

    const [selectedPointId, setSelectedPointId] = useState<
        number | undefined
    >();

    const {
        chargingPoints,
        waitingList,
        loading: pointsLoading,
        addToWaitingList,
        removeFromWaitingList,
        assignPointToUser,
        endSession,
        setPointMaintenance,
    } = useSupabaseChargingPoints(settings, isAdmin, getCurrentUser()?.email);

    const availablePoints = chargingPoints.filter(
        (p) => p.status === "available"
    ).length;
    const onlineUsers = getOnlineUsers();
    const loading = authLoading || usersLoading || pointsLoading;

    const handleClearWaitingList = () => {
        waitingList.forEach((entry) => removeFromWaitingList(entry.id));
        toast.success("Llista d'espera netejada");
    };

    const handleSelectPoint = (pointId: number) => {
        setSelectedPointId(pointId);
    };

    const handleClearSelection = () => {
        setSelectedPointId(undefined);
    };

    const handleAssignToPoint = async (
        pointId: number,
        userName: string,
        email: string
    ) => {
        const userId = await addOrUpdateUser(userName, email);
        if (userId) {
            await updateUserChargingPoint(userId, pointId);

            if (await assignPointToUser(pointId, userName, email)) {
                setSelectedPointId(undefined);
            }
        }
    };

    const handleSetCurrentUser = async (email: string, name?: string) => {
        if (name) {
            await addOrUpdateUser(name, email);
        }
    };

    const handleEmailSubmit = async (email: string, name: string) => {
        if (email && email.includes("@") && name) {
            // Verificar si l'usuari existeix a ev_users
            const isValid = await isValidUser(email);
            if (!isValid) {
                toast.error("Aquest correu no està autoritzat per accedir al sistema");
                return;
            }

            const userId = await addOrUpdateUser(name, email);
            if (userId) {
                toast.success(`Benvingut, ${name}!`);
            }
        }
    };

    const handleEndSession = async (pointId: number) => {
        // Find user at this point and update their status
        const point = chargingPoints.find((p) => p.id === pointId);
        if (point?.currentUser) {
            const user = users.find(
                (u) => u.email === point.currentUser?.email
            );
            if (user) {
                await updateUserChargingPoint(user.id, undefined);
            }
        }

        await endSession(pointId);
    };

    const handleAddToWaitingList = async (
        userName: string,
        email: string
    ): Promise<boolean> => {
        const userId = await addOrUpdateUser(userName, email);
        if (userId) {
            return await addToWaitingList(userName, email);
        }
        return false;
    };

    const handleRemoveFromWaitingList = async (entryId: string) => {
        await removeFromWaitingList(entryId);
    };

    // Show admin login if trying to access admin features but not logged in
    if (!isLoggedIn && window.location.hash === "#admin") {
        return (
            <AdminLogin
                onLogin={login}
                getDefaultCredentials={getDefaultAdminCredentials}
            />
        );
    }

    const currentUserData = getCurrentUser();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">
                        Carregant sistema multiusuari...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 bg-blue-600 rounded-full">
                            <Zap className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900">
                            Estació de Càrrega VE
                        </h1>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-lg text-gray-600 flex-wrap">
                        <span>Sistema Multiusuari amb Supabase</span>
                        <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                        >
                            <Clock className="h-3 w-3" />
                            Màx {settings.maxChargingHours}h per sessió
                        </Badge>
                        <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                        >
                            <Database className="h-3 w-3" />
                            Base de dades en temps real
                        </Badge>
                    </div>

                    {/* User Status */}
                    <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
                        {currentUserData && (
                            <Badge
                                variant="secondary"
                                className="flex items-center gap-1"
                            >
                                <User className="h-3 w-3" />
                                Usuari Actual: {currentUserData.name}
                            </Badge>
                        )}
                        {onlineUsers.length > 0 && (
                            <Badge
                                variant="outline"
                                className="flex items-center gap-1"
                            >
                                <Users className="h-3 w-3" />
                                {onlineUsers.length} usuaris en línia
                            </Badge>
                        )}
                        {isLoggedIn && (
                            <div className="flex items-center gap-2">
                                <Badge className="bg-green-600 hover:bg-green-700">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Admin: {currentUser}
                                </Badge>
                                <Button
                                    onClick={logout}
                                    variant="outline"
                                    size="sm"
                                >
                                    <LogOut className="h-4 w-4 mr-1" />
                                    Sortir
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* User Registration for Non-Logged Users */}
                    {!isLoggedIn && !currentUserData && (
                        <div className="mt-4 max-w-md mx-auto">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Identifiqui's per utilitzar el sistema
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="userName">
                                                Nom Complet
                                            </Label>
                                            <Input
                                                id="userName"
                                                type="text"
                                                placeholder="El seu nom complet"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="userEmail">
                                                Correu Electrònic
                                            </Label>
                                            <Input
                                                id="userEmail"
                                                type="email"
                                                placeholder="el.seu.correu@example.com"
                                            />
                                        </div>
                                        <Button
                                            onClick={async () => {
                                                const nameInput =
                                                    document.getElementById(
                                                        "userName"
                                                    ) as HTMLInputElement;
                                                const emailInput =
                                                    document.getElementById(
                                                        "userEmail"
                                                    ) as HTMLInputElement;
                                                if (nameInput && emailInput) {
                                                    const name =
                                                        nameInput.value.trim();
                                                    const email =
                                                        emailInput.value.trim();
                                                    if (
                                                        name &&
                                                        email &&
                                                        email.includes("@")
                                                    ) {
                                                        await handleEmailSubmit(
                                                            email,
                                                            name
                                                        );
                                                        nameInput.value = "";
                                                        emailInput.value = "";
                                                    } else {
                                                        toast.error(
                                                            "Si us plau, introdueixi nom i correu vàlids"
                                                        );
                                                    }
                                                }
                                            }}
                                            className="w-full"
                                        >
                                            Registrar-se
                                        </Button>
                                        <p className="text-xs text-muted-foreground">
                                            Això li permet gestionar la seva
                                            posició a la cua d'espera i veure
                                            altres usuaris
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                <Tabs defaultValue="charging-points" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2" >
                        <TabsTrigger
                            value="charging-points"
                            className="flex items-center gap-2"
                        >
                            <Zap className="h-4 w-4" />
                            Punts de Càrrega
                        </TabsTrigger>
                        {isAdmin && (<TabsTrigger
                            value="users"
                            className="flex items-center gap-2"
                        >
                            <Users className="h-4 w-4" />
                            Usuaris ({onlineUsers.length})
                        </TabsTrigger>)}
                        <TabsTrigger
                            value="user-form"
                            className="flex items-center gap-2"
                        >
                            <User className="h-4 w-4" />
                            Endollar / Cua
                        </TabsTrigger>
                        <TabsTrigger
                            value="queue"
                            className="flex items-center gap-2"
                        >
                            <Eye className="h-4 w-4" />
                            Llista d'Espera ({waitingList.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="admin"
                            className="flex items-center gap-2"
                            onClick={() =>
                                !isLoggedIn && (window.location.hash = "#admin")
                            }
                        >
                            <Settings className="h-4 w-4" />
                            Admin
                        </TabsTrigger>
                        {isAdmin && (
                            <TabsTrigger
                                value="settings"
                                className="flex items-center gap-2"
                            >
                                <Shield className="h-4 w-4" />
                                Configuració
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Charging Points Tab - Everyone can view */}
                    <TabsContent value="charging-points" className="space-y-6 mt-10">
                        <Card className="mt-10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5" />
                                    Tots els Punts de Càrrega - Supabase
                                    Real-Time
                                    <span className="text-sm font-normal text-muted-foreground">
                                        ({availablePoints} disponibles de 18)
                                    </span>
                                    {isLoggedIn && (
                                        <Badge variant="secondary">
                                            Vista Admin
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChargingPointGrid
                                    points={chargingPoints}
                                    onSelectPoint={handleSelectPoint}
                                    onEndSession={handleEndSession}
                                    onToggleMaintenance={setPointMaintenance}
                                    selectedPointId={selectedPointId}
                                    isUserView={true}
                                    isAdmin={isAdmin}
                                    currentUserEmail={currentUserData?.email}
                                    
                                />
                                {selectedPointId && (
                                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="text-blue-700 font-medium">
                                                Seleccionat: Punt de Càrrega #
                                                {selectedPointId}
                                            </span>
                                            <Button
                                                onClick={handleClearSelection}
                                                variant="ghost"
                                                size="sm"
                                            >
                                                Netejar Selecció
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Online Users Tab */}
                    <TabsContent value="users" className="space-y-6">
                        <OnlineUsers users={users} />
                    </TabsContent>

                    {/* User Form Tab */}
                    <TabsContent value="user-form">
                        <UserForm
                            onAddToWaitingList={handleAddToWaitingList}
                            onAssignToPoint={handleAssignToPoint}
                            availablePoints={availablePoints}
                            selectedPointId={selectedPointId}
                            onClearSelection={handleClearSelection}
                            onSetCurrentUser={handleSetCurrentUser}
                        />
                    </TabsContent>

                    {/* Queue Management Tab */}
                    <TabsContent value="queue" className="space-y-6">
                        <div className="grid lg:grid-cols-2 gap-6">
                            <WaitingList
                                waitingList={waitingList}
                                onRemoveFromList={handleRemoveFromWaitingList}
                                currentUserEmail={currentUserData?.email}
                                isAdmin={isAdmin}
                            />
                            <PublicWaitingList waitingList={waitingList} />
                        </div>
                    </TabsContent>

                    {/* Admin Panel Tab */}
                    <TabsContent value="admin">
                        {!isLoggedIn ? (
                            <AdminLogin
                                onLogin={login}
                                getDefaultCredentials={
                                    getDefaultAdminCredentials
                                }
                            />
                        ) : (
                            <div className="space-y-6">
                                <AdminPanel
                                    chargingPoints={chargingPoints}
                                    waitingList={waitingList}
                                    onClearWaitingList={handleClearWaitingList}
                                />
                                <AdminManagement
                                    administrators={administrators}
                                    currentUser={currentUser}
                                    onAddAdmin={addAdministrator}
                                    onRemoveAdmin={removeAdministrator}
                                />
                            </div>
                        )}
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings">
                        {isLoggedIn ? (
                            <SettingsPanel
                                settings={settings}
                                onUpdateMaxHours={updateMaxChargingHours}
                                onToggleEmailNotifications={
                                    toggleEmailNotifications
                                }
                            />
                        ) : (
                            <Card>
                                <CardContent className="text-center py-8">
                                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">
                                        Es requereix accés d'administrador
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
