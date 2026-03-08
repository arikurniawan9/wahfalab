# 📚 Standarisasi Komponen Admin - WahfaLab

**Tanggal:** 7 Maret 2026  
**Status:** ✅ Implemented

---

## 🎯 **Ringkasan**

Dokumen ini menjelaskan komponen-komponen terstandarisasi yang baru ditambahkan untuk meningkatkan konsistensi, maintainability, dan mobile responsiveness di seluruh halaman admin WahfaLab.

---

## 🆕 **KOMPONEN BARU**

### **1. StandardModal Components** ⭐

Lokasi: `src/components/ui/standard-modal.tsx`

#### **Keuntungan:**
- ✅ Konsistensi visual di semua modal
- ✅ Header dengan gradient berdasarkan variant
- ✅ Built-in close button
- ✅ Footer actions terstandarisasi
- ✅ Responsive design (max-w-[95vw] di mobile)

#### **Varian yang Tersedia:**

##### **a. StandardModal (Base)**
```tsx
import { StandardModal } from "@/components/ui";

<StandardModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Judul Modal"
  description="Deskripsi opsional"
  icon={<Icon className="h-6 w-6" />}
  variant="default" | "form" | "detail" | "wide" | "confirm"
  showCloseButton={true}
  disableOutsideClick={false}
>
  {/* Content */}
</StandardModal>
```

##### **b. FormModal (Preset untuk Form)**
```tsx
import { FormModal } from "@/components/ui";

<FormModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Tambah Data"
  description="Form untuk menambah data baru"
  icon={<Plus className="h-6 w-6" />}
  loading={submitting}
  onSubmit={handleSubmit}
  submitText="Simpan"
  cancelText="Batal"
>
  <div className="space-y-4">
    {/* Form fields */}
    <Input {...register("name")} />
  </div>
</FormModal>
```

**Features:**
- ✅ Built-in submit & cancel buttons
- ✅ Loading state pada tombol
- ✅ Gradient header emerald (form variant)
- ✅ Auto-disable saat loading

##### **c. DetailModal (Preset untuk Detail View)**
```tsx
import { DetailModal } from "@/components/ui";

<DetailModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Detail User"
  description="Informasi lengkap user"
  icon={<User className="h-6 w-6" />}
  primaryAction={{
    label: "Edit",
    onClick: handleEdit,
    icon: <Pencil className="h-4 w-4" />,
    variant: "default"
  }}
  secondaryAction={{
    label: "Hapus",
    onClick: handleDelete,
    icon: <Trash2 className="h-4 w-4" />
  }}
>
  {/* Detail content */}
</DetailModal>
```

**Features:**
- ✅ Primary & secondary action buttons
- ✅ Gradient header blue (detail variant)
- ✅ Wider modal (max-w-3xl)

##### **d. ConfirmModal (Preset untuk Konfirmasi)**
```tsx
import { ConfirmModal } from "@/components/ui";

<ConfirmModal
  open={showConfirm}
  onOpenChange={setShowConfirm}
  title="Konfirmasi Hapus"
  icon={<Trash2 className="h-6 w-6" />}
  onConfirm={handleDelete}
  loading={deleting}
  confirmText="Hapus"
  confirmVariant="destructive"
  message={
    <div className="space-y-3">
      <p>Apakah Anda yakin ingin menghapus data ini?</p>
      <p className="text-amber-600 font-medium">
        ⚠️ Data akan dihapus permanen.
      </p>
    </div>
  }
/>
```

**Features:**
- ✅ Custom confirmation message
- ✅ Loading state
- ✅ Destructive/confirm button variant
- ✅ Compact size (max-w-md)
- ✅ Amber gradient header

---

### **2. ResponsiveTable Component** ⭐⭐

Lokasi: `src/components/ui/responsive-table.tsx`

#### **Keuntungan:**
- ✅ **Otomatis mobile card view** - Tidak perlu manual implement
- ✅ **Built-in sorting** - Click header untuk sort
- ✅ **Row selection** - Checkbox support
- ✅ **Loading skeleton** - Automatic skeleton loader
- ✅ **Empty state** - Customizable empty state
- ✅ **Fully responsive** - Desktop table + mobile cards

#### **Basic Usage:**

```tsx
import { ResponsiveTable, type TableColumn } from "@/components/ui";

interface Item {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

const columns: TableColumn<Item>[] = [
  {
    key: "name",
    header: "Nama",
    sortable: true,
    showInMobile: true,
    mobilePriority: 1,
    cell: (item) => <span className="font-bold">{item.name}</span>,
  },
  {
    key: "email",
    header: "Email",
    sortable: true,
    showInMobile: true,
    mobilePriority: 2,
  },
  {
    key: "created_at",
    header: "Tanggal",
    sortable: true,
    showInMobile: false, // Hidden di mobile
  },
  {
    key: "actions",
    header: "Aksi",
    showInMobile: true,
    mobilePriority: 0,
    cell: (item) => (
      <Button onClick={() => handleEdit(item)}>Edit</Button>
    ),
  },
];

export default function MyPage() {
  const [data, setData] = useState<Item[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
    <ResponsiveTable
      columns={columns}
      data={data}
      loading={loading}
      selectable
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      getId={(item) => item.id}
      skeletonRows={10}
      emptyState={{
        title: "Belum ada data",
        description: "Mulai dengan menambahkan data pertama",
        action: <Button>Tambah Data</Button>,
      }}
      mobileCardView
      renderMobileCard={(item) => (
        /* Custom mobile card render (optional) */
        <div>Custom card content</div>
      )}
    />
  );
}
```

#### **Column Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `key` | string | - | **Required**. Unique column key |
| `header` | string | - | **Required**. Header label |
| `cell` | function | - | Custom cell renderer |
| `sortable` | boolean | false | Enable column sorting |
| `showInMobile` | boolean | true | Show in mobile card view |
| `mobilePriority` | number | 0 | Higher = more important |
| `headerClassName` | string | - | Custom header class |
| `cellClassName` | string | - | Custom cell class |

#### **Table Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columns` | Column[] | - | **Required**. Column definitions |
| `data` | T[] | - | **Required**. Data to display |
| `loading` | boolean | false | Loading state |
| `selectable` | boolean | false | Enable row selection |
| `selectedIds` | string[] | [] | Selected row IDs |
| `onSelectionChange` | function | - | Selection change handler |
| `getId` | function | - | Get item ID function |
| `onRowClick` | function | - | Row click handler |
| `hoverable` | boolean | true | Enable hover effect |
| `skeletonRows` | number | 5 | Number of skeleton rows |
| `mobileCardView` | boolean | true | Enable mobile cards |
| `renderMobileCard` | function | - | Custom mobile card render |
| `emptyState` | ReactNode | - | Empty state component |

---

## 📋 **MIGRATION GUIDE**

### **Dari Dialog Biasa ke FormModal**

#### **Before:**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Judul</DialogTitle>
      <DialogDescription>Deskripsi</DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <DialogFooter>
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Batal
        </Button>
        <LoadingButton type="submit" loading={loading}>
          Simpan
        </LoadingButton>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

#### **After:**
```tsx
<FormModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Judul"
  description="Deskripsi"
  icon={<Icon />}
  loading={loading}
  onSubmit={handleSubmit}
>
  {/* Form fields */}
</FormModal>
```

**Benefits:**
- ✅ 50% less code
- ✅ Consistent styling
- ✅ Built-in loading state
- ✅ Better mobile UX

---

### **Dari AlertDialog ke ConfirmModal**

#### **Before:**
```tsx
<AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
      <AlertDialogDescription>
        Apakah Anda yakin?
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Batal</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Hapus
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### **After:**
```tsx
<ConfirmModal
  open={showConfirm}
  onOpenChange={setShowConfirm}
  title="Konfirmasi Hapus"
  icon={<Trash2 />}
  onConfirm={handleDelete}
  loading={deleting}
  message={
    <div>
      <p>Apakah Anda yakin?</p>
      <p className="text-amber-600">⚠️ Data akan dihapus permanen.</p>
    </div>
  }
/>
```

**Benefits:**
- ✅ Better visual hierarchy
- ✅ Custom message support
- ✅ Loading state built-in
- ✅ Consistent with other modals

---

### **Dari Table Manual ke ResponsiveTable**

#### **Before:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nama</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Aksi</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {loading ? (
      <TableRow>
        <TableCell colSpan={3}>
          <TableSkeleton rows={5} />
        </TableCell>
      </TableRow>
    ) : data.length === 0 ? (
      <TableRow>
        <TableCell colSpan={3}>
          <EmptyState title="Tidak ada data" />
        </TableCell>
      </TableRow>
    ) : (
      data.map((item) => (
        <TableRow key={item.id}>
          <TableCell>{item.name}</TableCell>
          <TableCell>{item.email}</TableCell>
          <TableCell>
            <Button>Edit</Button>
          </TableCell>
        </TableRow>
      ))
    )}
  </TableBody>
</Table>

{/* Mobile view - manual implementation */}
<div className="md:hidden">
  {data.map((item) => (
    <div key={item.id} className="p-4">
      <h4>{item.name}</h4>
      <p>{item.email}</p>
      <Button>Edit</Button>
    </div>
  ))}
</div>
```

#### **After:**
```tsx
<ResponsiveTable
  columns={[
    { key: "name", header: "Nama", showInMobile: true },
    { key: "email", header: "Email", showInMobile: true },
    { 
      key: "actions", 
      header: "Aksi", 
      showInMobile: true,
      cell: (item) => <Button>Edit</Button>
    },
  ]}
  data={data}
  loading={loading}
  emptyState={{ title: "Tidak ada data" }}
  mobileCardView
/>
```

**Benefits:**
- ✅ 70% less code
- ✅ Automatic responsive
- ✅ Built-in sorting
- ✅ Built-in selection
- ✅ Consistent styling

---

## 🎨 **EXAMPLE IMPLEMENTATION**

### **Complete Page Example**

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { 
  ResponsiveTable, 
  type TableColumn,
  LoadingOverlay 
} from "@/components/ui";
import { FormModal, ConfirmModal } from "@/components/ui/standard-modal";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function UsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const loadData = async () => {
    setLoading(true);
    // Fetch data...
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      // Save data...
      setIsDialogOpen(false);
      loadData();
      toast.success("User saved");
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setSubmitting(true);
    try {
      // Delete data...
      setDeleteId(null);
      loadData();
      toast.success("User deleted");
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: TableColumn<User>[] = [
    {
      key: "name",
      header: "Nama",
      sortable: true,
      showInMobile: true,
      mobilePriority: 1,
      cell: (item) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
            {item.name.charAt(0)}
          </div>
          <span className="font-bold">{item.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      showInMobile: true,
      mobilePriority: 2,
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      showInMobile: false,
      cell: (item) => (
        <Badge>{item.role}</Badge>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      showInMobile: true,
      mobilePriority: 0,
      cell: (item) => (
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              setEditingUser(item);
              setIsDialogOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setDeleteId(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => {
          setEditingUser(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Input placeholder="Search users..." />
      </div>

      {/* Table */}
      <ResponsiveTable
        columns={columns}
        data={data}
        loading={loading}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        getId={(item) => item.id}
        emptyState={{
          title: "No users found",
          action: (
            <Button onClick={() => setIsDialogOpen(true)}>
              Add User
            </Button>
          ),
        }}
        mobileCardView
      />

      {/* Add/Edit Modal */}
      <FormModal
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            reset();
            setEditingUser(null);
          }
        }}
        title={editingUser ? "Edit User" : "Add New User"}
        icon={<Plus className="h-6 w-6" />}
        loading={submitting}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold">Name</label>
            <Input {...register("name")} required />
          </div>
          <div>
            <label className="text-sm font-semibold">Email</label>
            <Input type="email" {...register("email")} required />
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Confirm Delete"
        icon={<Trash2 className="h-6 w-6" />}
        onConfirm={confirmDelete}
        loading={submitting}
        message={
          <div>
            <p>Are you sure you want to delete this user?</p>
            <p className="text-amber-600 mt-2">
              ⚠️ This action cannot be undone.
            </p>
          </div>
        }
      />

      {/* Loading Overlay */}
      <LoadingOverlay
        isOpen={submitting}
        title="Saving..."
        variant="modal"
      />
    </div>
  );
}
```

---

## ✅ **CHECKLIST IMPLEMENTATION**

### **Untuk Halaman Baru:**

- [ ] Import komponen yang diperlukan
- [ ] Definisikan columns untuk ResponsiveTable
- [ ] Gunakan FormModal untuk add/edit
- [ ] Gunakan ConfirmModal untuk delete confirmation
- [ ] Enable mobileCardView di ResponsiveTable
- [ ] Test di desktop dan mobile view

### **Untuk Migrasi Halaman Existing:**

- [ ] Backup file existing
- [ ] Ganti Dialog dengan FormModal/DetailModal
- [ ] Ganti AlertDialog dengan ConfirmModal
- [ ] Ganti Table manual dengan ResponsiveTable
- [ ] Test semua fungsi (CRUD operations)
- [ ] Test responsive design di mobile
- [ ] Remove duplicate code

---

## 📊 **BENEFITS**

### **Developer Experience:**
- ✅ **50-70% less code** untuk modals
- ✅ **Consistent patterns** di semua halaman
- ✅ **Type-safe** dengan TypeScript
- ✅ **Easy to maintain** - centralized changes

### **User Experience:**
- ✅ **Better mobile UX** - automatic card view
- ✅ **Consistent UI** di semua dialogs
- ✅ **Faster interactions** - optimized components
- ✅ **Professional look** - gradient headers, animations

### **Performance:**
- ✅ **Smaller bundle** - less duplicate code
- ✅ **Better rendering** - optimized components
- ✅ **Responsive by default** - no extra code needed

---

## 🚀 **NEXT STEPS**

### **Recommended Pages to Update:**

1. **Services** (`/admin/services`) - High priority
2. **Users** (`/admin/users`) - High priority
3. **Customers** (`/admin/customers`) - Medium priority
4. **Equipment** (`/admin/equipment`) - Medium priority
5. **Sampling** (`/admin/sampling`) - Medium priority

### **Optional Enhancements:**

1. Add search functionality to ResponsiveTable
2. Add column resizing
3. Add column visibility toggle
4. Add export to Excel/PDF from table
5. Add row expansion for details

---

## 📚 **REFERENCES**

**Components:**
- `src/components/ui/standard-modal.tsx`
- `src/components/ui/responsive-table.tsx`
- `src/components/ui/index.ts`

**Example:**
- `src/app/(admin)/admin/categories/page.optimized.tsx`

**Documentation:**
- `ADMIN_PAGE_STANDARDIZATION.md`
- `LOADING_STATES_BEST_PRACTICES.md`

---

*Last Updated: March 7, 2026*  
*Status: ✅ Production Ready*
