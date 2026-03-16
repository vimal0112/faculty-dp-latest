import { useState, useEffect } from 'react';
import { Users, Search, CheckCircle, XCircle, Shield, Mail, Building2 } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AdminControl = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await adminAPI.getUsers();
            setUsers(data || []);
        } catch (error) {
            console.error('Failed to load users:', error);
            toast({ title: 'Failed to load user list', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            await adminAPI.toggleUserStatus(userId, newStatus);
            toast({
                title: `User ${newStatus === 'active' ? 'Activated' : 'Inactivated'}`,
                description: `Account access has been ${newStatus === 'active' ? 'restored' : 'revoked'}.`
            });
            setUsers(users.map(u => u._id === userId ? { ...u, status: newStatus } : u));
        } catch (error) {
            console.error('Failed to update status:', error);
            toast({ title: 'Failed to update user status', variant: 'destructive' });
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">User Control</h1>
                    <p className="text-muted-foreground">Manage faculty account activation and access</p>
                </div>
                <Badge variant="outline" className="px-3 py-1 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-600">Access Management</span>
                </Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Registered Faculties</CardTitle>
                    <CardDescription>Activation and Deactivation of faculty accounts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, or department..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 max-w-md"
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                            No faculty accounts found matching your search.
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[80px]">S.No</TableHead>
                                        <TableHead>Faculty Information</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right pr-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user, index) => (
                                        <TableRow key={user._id} className="hover:bg-muted/20 transition-colors">
                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground">{user.name}</span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Mail className="h-3 w-3" /> {user.email}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">{user.department || 'N/A'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={user.status === 'inactive' ? 'destructive' : 'default'}
                                                    className={`capitalize ${user.status === 'inactive' ? 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200'}`}
                                                >
                                                    {user.status || 'active'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button
                                                    size="sm"
                                                    variant={user.status === 'inactive' ? 'default' : 'outline'}
                                                    className={user.status === 'inactive' ? 'bg-blue-600 hover:bg-blue-700' : 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'}
                                                    onClick={() => handleToggleStatus(user._id, user.status || 'active')}
                                                >
                                                    {user.status === 'inactive' ? (
                                                        <>
                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                            Activate
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-4 w-4 mr-2" />
                                                            Inactivate
                                                        </>
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Access Policy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            By default, all registered faculty are <span className="text-green-600 font-semibold">Activated</span>.
                            Inactivating a user will immediately block them from logging in or re-registering until manually restored.
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Account Monitoring</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Use this module for security management. Inactivated accounts remain in the database but are denied
                            system access across all platforms.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminControl;
