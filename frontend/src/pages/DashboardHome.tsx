import { Package, Store, Users } from 'lucide-react';
import { Link } from 'react-router';
import { useSession } from '../hooks/useAuth';
import { useManagedList } from '../hooks/useManagement';
import { managementApi, pageItems } from '../lib/management';
import { LoadingPanel } from '../components/dashboard/Ui';
import { PageHeader } from '../components/dashboard/Ui';
import { hasCapability } from '../lib/auth';

export default function DashboardHome() {
  const user = useSession().data!.user; const params={limit:100}; const umkms=useManagedList('manage','umkms',params,signal=>managementApi.umkms.list(params,signal)); const products=useManagedList('manage','products',params,signal=>managementApi.products.list(params,signal)); const canViewUsers=hasCapability(user,'users:view'); const users=useManagedList('admin','users',params,signal=>managementApi.users.list(params,signal),canViewUsers); const counts=[{to:'/dashboard/umkms',label:'UMKM',count:pageItems(umkms.data).length,text:'Profil usaha terkelola.',icon:Store},{to:'/dashboard/products',label:'Produk',count:pageItems(products.data).length,text:'Produk dalam katalog.',icon:Package},...(canViewUsers ? [{to:'/dashboard/users',label:'Pengguna',count:pageItems(users.data).length,text:'Akun pengelola.',icon:Users}] : [])];
  if(umkms.isPending||products.isPending||(canViewUsers&&users.isPending))return <LoadingPanel/>;
  return <><PageHeader title={`Selamat datang, ${user.displayName}`} description={hasCapability(user,'dashboard:view-global-summary') ? 'Pantau dan kelola seluruh data direktori UMKM Desa Loning.' : 'Kelola profil usaha dan produk yang menjadi tanggung jawab Anda.'}/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{counts.map(({to,label,count,text,icon:Icon}) => <Link key={to} to={to} className="focus-ring transition-card rounded-2xl border border-sage-border bg-white p-5 hover:-translate-y-0.5 hover:shadow-lg"><span className="mb-7 grid h-11 w-11 place-items-center rounded-xl bg-sage-light text-forest"><Icon className="h-5 w-5"/></span><p className="text-3xl font-extrabold">{count}</p><h2 className="mt-1 font-extrabold text-charcoal">{label}</h2><p className="mt-1.5 text-sm leading-6 text-warm-gray">{text}</p></Link>)}</div></>;
}
