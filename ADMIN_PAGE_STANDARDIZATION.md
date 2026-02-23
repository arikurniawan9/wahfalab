# Admin Page Standardization Guide

## 📋 Overview

Dokumen ini menjelaskan pattern standar untuk halaman admin di WahfaLab untuk memastikan konsistensi, maintainability, dan UX yang baik.

---

## 🧩 Reusable Components

### 1. DataTable Component

Komponen tabel yang dapat digunakan kembali dengan fitur sorting, selection, dan pagination.

```tsx
import { DataTable } from "@/components/ui";

<DataTable
  columns={[
    { key: "name", header: "Nama" },
    { key: "email", header: "Email" },
    { 
      key: "role", 
      header: "Role",
      cell: (item) => <Badge>{item.role}</Badge>
    },
  ]}
  data={users}
  loading={loading}
  emptyState={<EmptyState title="Tidak ada user" />}
  selectable
  selectedIds={selectedIds}
  onSelectionChange={setSelectedIds}
  getId={(item) => item.id}
  onRowClick={(item) => handleEdit(item)}
/>
```

**Features:**
- ✅ Auto sorting (click header)
- ✅ Row selection (checkbox)
- ✅ Select all
- ✅ Custom cell rendering
- ✅ Loading state
- ✅ Empty state
- ✅ Row click handler

---

### 2. SearchInput Component

Input pencarian dengan clear button.

```tsx
import { SearchInput } from "@/components/ui";

<SearchInput
  placeholder="Cari nama atau email..."
  value={search}
  onChange={setSearch}
  onSearch={(value) => handleSearch(value)}
  disabled={loading}
/>
```

**Features:**
- ✅ Auto-clear button
- ✅ Search on Enter
- ✅ Debounced (optional)
- ✅ Disabled state

---

### 3. Pagination Component

Pagination dengan smart page numbers.

```tsx
import { Pagination } from "@/components/ui";

<Pagination
  currentPage={page}
  totalPages={pages}
  onPageChange={setPage}
/>
```

**Features:**
- ✅ Smart page ellipsis
- ✅ Previous/Next buttons
- ✅ Disabled state for edges
- ✅ Active page highlight

---

### 4. EmptyState Component

Empty state yang informatif.

```tsx
import { EmptyState } from "@/components/ui";

<EmptyState
  title="Tidak ada data"
  description="Mulai dengan menambahkan data pertama Anda"
  icon={<YourIcon className="h-16 w-16" />}
  action={
    <Button onClick={() => setIsDialogOpen(true)}>
      <Plus className="mr-2 h-4 w-4" /> Tambah Data
    </Button>
  }
/>
```

**Features:**
- ✅ Custom icon
- ✅ Custom title & description
- ✅ Action button support

---

### 5. Skeleton Loaders

Loading placeholders untuk berbagai layout.

```tsx
import { Skeleton, CardSkeleton, TableSkeleton, PageSkeleton } from "@/components/ui";

// Full page skeleton
<PageSkeleton />

// Card grid skeleton
<CardSkeleton count={3} className="grid-cols-3" />

// Table skeleton
<TableSkeleton rows={5} />

// Custom skeleton
<Skeleton className="h-8 w-32" />
```

---

## 🎣 Custom Hooks

### useCrud Hook

Hook untuk operasi CRUD dengan state management otomatis.

```tsx
import { useCrud } from "@/hooks";

function UsersPage() {
  const {
    data,
    loading,
    page,
    limit,
    search,
    setSearch,
    setPage,
    create,
    update,
    delete: deleteItem,
    deleteMany,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    refresh,
  } = useCrud({
    fetchFn: getUsers,
    createFn: createUser,
    updateFn: updateUser,
    deleteFn: deleteUser,
    deleteManyFn: deleteManyUsers,
    messages: {
      createSuccess: "User berhasil ditambahkan",
      updateSuccess: "User berhasil diperbarui",
      deleteSuccess: "User berhasil dihapus",
    },
    initialPage: 1,
    initialLimit: 10,
  });

  return (
    // Your component JSX
  );
}
```

**Features:**
- ✅ Automatic data fetching
- ✅ Pagination state
- ✅ Search state
- ✅ Selection state
- ✅ CRUD operations with toast
- ✅ Error handling
- ✅ Refresh function

---

## ⚠️ Error Handling

### Standardized Error Handler

```tsx
import { handleError, handleSuccess, withErrorHandling } from "@/lib/utils/error-handler";

// Manual error handling
try {
  await createUser(data);
  handleSuccess("User ditambahkan", {
    description: `${data.full_name} berhasil ditambahkan`,
  });
} catch (error) {
  handleError(error, {
    title: "Gagal menambahkan user",
    action: "create",
  });
}

// Automatic error handling with wrapper
const handleCreate = withErrorHandling(
  async (data) => {
    return await createUser(data);
  },
  {
    title: "Gagal menambahkan user",
    action: "create",
    onSuccess: () => {
      // Optional success callback
      refresh();
    },
  }
);
```

---

## ✅ Input Validation

### Zod Schemas

```tsx
import { schemas } from "@/lib/validations";

// Validate form data
const result = schemas.user.safeParse(formData);

if (!result.success) {
  // Handle validation errors
  result.error.errors.forEach((err) => {
    toast.error(err.message);
  });
  return;
}

// Use validated data
await createUser(result.data);
```

**Available schemas:**
- `user` - User management
- `category` - Categories
- `service` - Services
- `equipment` - Equipment rental
- `transportCost` - Transport costs
- `engineerCost` - Engineer costs
- `quotation` - Quotations
- `jobOrder` - Job orders
- `samplingAssignment` - Sampling assignments
- `labAnalysis` - Lab analysis
- `companyProfile` - Company profile

---

## 📐 Page Structure Template

```tsx
"use client";

import React, { useState } from "react";
import { DataTable, SearchInput, Pagination, EmptyState } from "@/components/ui";
import { useCrud } from "@/hooks";
import { handleError, handleSuccess } from "@/lib/utils/error-handler";
import { schemas } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function ExamplePage() {
  // Use CRUD hook
  const {
    data,
    loading,
    page,
    setPage,
    pages,
    search,
    setSearch,
    create,
    update,
    delete: deleteItem,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    deleteMany,
    refresh,
  } = useCrud({
    fetchFn: fetchData,
    createFn: createData,
    updateFn: updateData,
    deleteFn: deleteData,
    deleteManyFn: deleteManyData,
    messages: {
      createSuccess: "Data berhasil ditambahkan",
      updateSuccess: "Data berhasil diperbarui",
      deleteSuccess: "Data berhasil dihapus",
    },
  });

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Handlers
  const handleSubmit = async (formData) => {
    // Validate
    const result = schemas.category.safeParse(formData);
    if (!result.success) {
      handleError(result.error, { action: editingItem ? "update" : "create" });
      return;
    }

    // Create or update
    if (editingItem) {
      await update(editingItem.id, result.data);
    } else {
      await create(result.data);
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async (id) => {
    await deleteItem(id);
  };

  const handleBulkDelete = async () => {
    await deleteMany(selectedIds);
  };

  // Table columns
  const columns = [
    { key: "name", header: "Nama" },
    { key: "description", header: "Deskripsi" },
    {
      key: "actions",
      header: "Aksi",
      cell: (item) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingItem(item);
              setIsDialogOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Judul Halaman</h1>
          <p className="text-slate-500">Deskripsi halaman</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Data
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <SearchInput
          placeholder="Cari..."
          value={search}
          onChange={setSearch}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={(ids) => {}}
        getId={(item) => item.id}
        emptyState={
          <EmptyState
            title="Tidak ada data"
            action={
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Data
              </Button>
            }
          />
        }
      />

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={pages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Best Practices

### 1. Consistent Naming
- ✅ `handleCreate`, `handleUpdate`, `handleDelete`
- ✅ `isDialogOpen`, `editingItem`
- ✅ `selectedIds`, `setSelectedIds`

### 2. Error Messages
```tsx
// ✅ Good
toast.error("Gagal menambahkan data", {
  description: "Nama kategori sudah digunakan"
});

// ❌ Bad
toast.error("Error!");
```

### 3. Loading States
```tsx
// ✅ Use skeleton for better UX
{loading ? <TableSkeleton rows={5} /> : <DataTable ... />}

// ❌ Don't just show spinner
{loading && <Spinner />}
```

### 4. Form Validation
```tsx
// ✅ Validate before submit
const result = schemas.category.safeParse(formData);
if (!result.success) {
  handleError(result.error);
  return;
}

// ❌ Don't submit invalid data
await create(formData); // Without validation
```

### 5. User Feedback
```tsx
// ✅ Clear feedback for all actions
handleSuccess("Data ditambahkan", {
  description: `${formData.name} berhasil ditambahkan`
});

handleError(error, {
  action: "create",
  description: "Silakan coba lagi"
});

// ❌ Silent failures
// No feedback to user
```

---

## 🔄 Migration Guide

### From Old Pattern to New Pattern

**Before:**
```tsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [page, setPage] = useState(1);

useEffect(() => {
  loadData();
}, [page]);

const loadData = async () => {
  setLoading(true);
  try {
    const result = await getData(page, 10, search);
    setData(result);
  } catch (error) {
    toast.error("Error");
  } finally {
    setLoading(false);
  }
};
```

**After:**
```tsx
const { data, loading, page, setPage, refresh } = useCrud({
  fetchFn: getData,
  messages: {
    loading: "Gagal memuat data",
  },
});
```

---

## 📚 Examples

Lihat implementasi lengkap di:
- `src/app/(admin)/admin/users/page.tsx` - User management
- `src/app/(admin)/admin/categories/page.tsx` - Category management
- `src/app/(admin)/admin/services/page.tsx` - Service management

---

*Last Updated: February 23, 2026*
