# 🎯 Loading States Best Practices - WahfaLab Admin

**Tanggal:** 23 Februari 2026
**Status:** ✅ Recommended

---

## 📋 **Overview**

Dokumen ini menjelaskan **best practices** untuk loading states di halaman admin WahfaLab untuk memberikan user experience yang optimal.

---

## 🎨 **TYPES OF LOADING STATES**

### **1. Page/Data Loading** ✅

**When to use:**
- Initial page load
- Refreshing data
- Pagination
- Search/filter changes

**Component:** `TableSkeleton` or `PageSkeleton`

```tsx
import { TableSkeleton, PageSkeleton } from "@/components/ui";

function UsersPage() {
  const { data, loading } = useCrud({ ... });

  if (loading) {
    return <TableSkeleton rows={10} />;
  }

  return <DataTable data={data} ... />;
}
```

**Best Practices:**
- ✅ Show skeleton immediately (no delay)
- ✅ Match skeleton to actual content layout
- ✅ Include shimmer animation
- ✅ Show estimated time if > 3 seconds

---

### **2. Form Submission Loading** ✅

**When to use:**
- Creating new data
- Updating data
- Deleting data
- Bulk operations

**Component:** `LoadingOverlay` + `LoadingButton`

```tsx
import { LoadingOverlay, LoadingButton } from "@/components/ui";

function UserForm() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      await createUser(data);
      toast.success("User created");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <LoadingButton
        type="submit"
        loading={submitting}
        loadingText="Menyimpan..."
      >
        Simpan
      </LoadingButton>

      <LoadingOverlay
        isOpen={submitting}
        title="Menyimpan Data..."
        description="Mohon tunggu sebentar"
        variant="modal"
      />
    </>
  );
}
```

**Best Practices:**
- ✅ Disable form inputs during submit
- ✅ Show loading on button
- ✅ Show overlay for operations > 1 second
- ✅ Provide cancel option for long operations
- ✅ Auto-close on success/error

---

### **3. Row-Level Loading** ✅

**When to use:**
- Delete single row
- Edit inline
- Quick actions
- Approval actions

**Component:** `InlineLoader`

```tsx
import { InlineLoader } from "@/components/ui";

function UsersTable() {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteUser(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Table>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>
              {deletingId === user.id ? (
                <InlineLoader isLoading size="sm" />
              ) : (
                <Button onClick={() => handleDelete(user.id)}>
                  Delete
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**Best Practices:**
- ✅ Only disable the specific row/action
- ✅ Keep other interactions available
- ✅ Show loader inline with action
- ✅ Re-enable on complete

---

### **4. Progress Loading** ✅

**When to use:**
- File uploads
- Bulk operations
- Data imports
- Batch processing

**Component:** `LoadingOverlay` with progress

```tsx
import { LoadingOverlay } from "@/components/ui";

function ImportUsers() {
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);

  const handleImport = async (file) => {
    setImporting(true);
    setProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      setImporting(false);
      toast.success("Import completed");
    });

    // ... send file
  };

  return (
    <LoadingOverlay
      isOpen={importing}
      title="Mengimport Data..."
      description={`${progress}% file uploaded`}
      progress={progress}
      variant="modal"
    />
  );
}
```

**Best Practices:**
- ✅ Show actual percentage when possible
- ✅ Update progress smoothly (not jumpy)
- ✅ Show current step/stage
- ✅ Provide time estimate if possible
- ✅ Allow cancellation

---

## 🎨 **COMPONENT VARIANTS**

### **LoadingOverlay Variants**

```tsx
// Full screen (for major operations)
<LoadingOverlay
  isOpen={majorLoading}
  variant="fullscreen"
  title="Processing Large Dataset..."
/>

// Modal (for form submissions)
<LoadingOverlay
  isOpen={submitting}
  variant="modal"
  title="Saving Data..."
/>

// Inline (for partial page updates)
<LoadingOverlay
  isOpen={refreshing}
  variant="inline"
/>
```

### **LoadingButton Variants**

```tsx
// Default (spinner left)
<LoadingButton loading={loading}>
  Save
</LoadingButton>

// Spinner right
<LoadingButton loading={loading} spinnerPosition="right">
  Submit
</LoadingButton>

// Custom loading text
<LoadingButton
  loading={loading}
  loadingText="Please wait..."
>
  Submit
</LoadingButton>
```

---

## ⏱️ **TIMING GUIDELINES**

### **Immediate Feedback (< 100ms)**
- Button disabled state
- Loading spinner appears
- UI state changes

### **Skeleton Loading (100ms - 1s)**
- Show immediately
- No need for "loading..." text
- Shimmer animation

### **Overlay Loading (> 1s)**
- Show after 500ms delay
- Provide context (what's happening)
- Show progress if possible

### **Long Operations (> 5s)**
- Show progress percentage
- Provide cancel option
- Show current step
- Consider background processing

---

## 🎯 **IMPLEMENTATION PATTERNS**

### **Pattern 1: CRUD Operations**

```tsx
function UserManagement() {
  const [action, setAction] = useState<'create' | 'update' | 'delete' | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const handleCreate = async (data) => {
    setAction('create');
    try {
      await createUser(data);
      toast.success("User created");
    } finally {
      setAction(null);
    }
  };

  const handleUpdate = async (id, data) => {
    setAction('update');
    setActionId(id);
    try {
      await updateUser(id, data);
      toast.success("User updated");
    } finally {
      setAction(null);
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    setAction('delete');
    setActionId(id);
    try {
      await deleteUser(id);
      toast.success("User deleted");
    } finally {
      setAction(null);
      setActionId(null);
    }
  };

  return (
    <>
      {/* Page loading */}
      {loading ? (
        <TableSkeleton rows={10} />
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            {
              key: "actions",
              header: "Actions",
              cell: (user) => (
                <>
                  {actionId === user.id && action === 'update' ? (
                    <InlineLoader isLoading />
                  ) : (
                    <Button onClick={() => handleUpdate(user.id, user)}>
                      Edit
                    </Button>
                  )}

                  {actionId === user.id && action === 'delete' ? (
                    <InlineLoader isLoading />
                  ) : (
                    <Button onClick={() => handleDelete(user.id)}>
                      Delete
                    </Button>
                  )}
                </>
              ),
            },
          ]}
        />
      )}

      {/* Form submission overlay */}
      <LoadingOverlay
        isOpen={action === 'create'}
        title={action === 'create' ? "Creating User..." : "Updating User..."}
        variant="modal"
      />
    </>
  );
}
```

---

### **Pattern 2: Optimistic Updates**

```tsx
function QuickActions() {
  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set());

  const handleApprove = async (id) => {
    // Add to optimistic set immediately
    setOptimisticIds(prev => new Set(prev).add(id));

    try {
      await approveRequest(id);
      toast.success("Approved");
    } catch (error) {
      // Rollback on error
      setOptimisticIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.error("Failed to approve");
    }
  };

  return (
    <Button
      onClick={() => handleApprove(request.id)}
      disabled={optimisticIds.has(request.id)}
    >
      {optimisticIds.has(request.id) ? (
        <InlineLoader isLoading size="sm" showText text="Approving" />
      ) : (
        "Approve"
      )}
    </Button>
  );
}
```

---

### **Pattern 3: Debounced Search with Loading**

```tsx
function SearchableTable() {
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search) {
        setIsSearching(true);
        await refetch({ search });
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <>
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search..."
      />

      {isSearching ? (
        <TableSkeleton rows={5} />
      ) : (
        <DataTable data={data} ... />
      )}
    </>
  );
}
```

---

## 🎨 **VISUAL DESIGN GUIDELINES**

### **Colors**

```tsx
// Success states
success: "bg-emerald-600"

// Loading states
loading: "bg-slate-600"

// Error states
error: "bg-red-600"

// Warning states
warning: "bg-amber-600"
```

### **Animations**

```tsx
// Spinner rotation
animate-spin

// Fade in/out
transition-opacity duration-200

// Progress bar
transition-all duration-300 ease-out

// Shimmer effect
animate-pulse
```

### **Typography**

```tsx
// Loading titles
"text-lg font-semibold"

// Loading descriptions
"text-sm text-slate-500"

// Progress text
"text-xs text-slate-400"
```

---

## 📊 **PERFORMANCE TIPS**

### **1. Avoid Loading Flicker**

```tsx
// ❌ Bad - Shows/hides too quickly
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetchData().then(() => setLoading(false));
}, []);

// ✅ Good - Minimum display time
useEffect(() => {
  setLoading(true);
  const minDelay = new Promise(resolve => setTimeout(resolve, 300));
  
  Promise.all([fetchData(), minDelay]).finally(() => {
    setLoading(false);
  });
}, []);
```

### **2. Progressive Loading**

```tsx
// Load critical data first
useEffect(() => {
  fetchCriticalData().then(setData);
  
  // Then load secondary data
  setTimeout(() => {
    fetchSecondaryData().then(setSecondaryData);
  }, 100);
}, []);
```

### **3. Smart Caching**

```tsx
// Cache data to avoid reloads
const { data } = useQuery({
  queryKey: ['users', page],
  queryFn: () => fetchUsers(page),
  staleTime: 5 * 60 * 1000, // 5 minutes
  keepPreviousData: true,
});
```

---

## ✅ **CHECKLIST**

### **Before Implementation:**
- [ ] Identify all loading scenarios
- [ ] Choose appropriate loading component
- [ ] Define loading duration expectations
- [ ] Plan error states

### **During Implementation:**
- [ ] Disable interactions during loading
- [ ] Show clear loading indicator
- [ ] Provide context (what's loading)
- [ ] Handle errors gracefully

### **After Implementation:**
- [ ] Test with slow network
- [ ] Test error scenarios
- [ ] Verify loading states are visible
- [ ] Check accessibility (screen readers)

---

## 🚀 **EXAMPLE IMPLEMENTATION**

### **Complete Admin Page Pattern**

```tsx
"use client";

import React, { useState } from "react";
import {
  DataTable,
  SearchInput,
  Pagination,
  EmptyState,
  TableSkeleton,
  LoadingOverlay,
  LoadingButton,
  InlineLoader
} from "@/components/ui";
import { useCrud } from "@/hooks";

export default function UsersPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
  } = useCrud({
    fetchFn: getUsers,
    createFn: createUser,
    updateFn: updateUser,
    deleteFn: deleteUser,
    messages: {
      createSuccess: "User berhasil ditambahkan",
      updateSuccess: "User berhasil diperbarui",
      deleteSuccess: "User berhasil dihapus",
    },
  });

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    await deleteItem(id);
    setDeleteId(null);
  };

  const handleSubmit = async (formData) => {
    if (editingUser) {
      await update(editingUser.id, formData);
    } else {
      await create(formData);
    }
    setIsDialogOpen(false);
  };

  const columns = [
    { key: "name", header: "Nama" },
    { key: "email", header: "Email" },
    {
      key: "actions",
      header: "Aksi",
      cell: (item) => (
        <>
          {deleteId === item.id ? (
            <InlineLoader isLoading size="sm" />
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(item)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(item.id)}
              >
                Delete
              </Button>
            </>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <LoadingButton
          onClick={() => setIsDialogOpen(true)}
          loading={loading && !data.length}
        >
          <Plus className="mr-2 h-4 w-4" /> Add User
        </LoadingButton>
      </div>

      {/* Search */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search users..."
      />

      {/* Table */}
      {loading && !data.length ? (
        <TableSkeleton rows={10} />
      ) : data.length === 0 ? (
        <EmptyState
          title="No users found"
          action={
            <Button onClick={() => setIsDialogOpen(true)}>
              Add First User
            </Button>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data}
            loading={loading}
          />

          {pages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            {/* Form fields */}
            <LoadingButton
              type="submit"
              loading={false}
              loadingText="Saving..."
            >
              Save User
            </LoadingButton>
          </form>
        </DialogContent>
      </Dialog>

      {/* Global Loading Overlay */}
      <LoadingOverlay
        isOpen={false} // Controlled by specific actions
        title="Processing..."
        variant="modal"
      />
    </div>
  );
}
```

---

## 📚 **REFERENCES**

**Components:**
- `LoadingOverlay` - `src/components/ui/loading-overlay.tsx`
- `LoadingButton` - `src/components/ui/loading-button.tsx`
- `InlineLoader` - `src/components/ui/inline-loader.tsx`
- `Skeleton` - `src/components/ui/skeleton.tsx`

**Hooks:**
- `useCrud` - `src/hooks/use-crud.ts`

**Examples:**
- `src/app/(admin)/admin/users/page.tsx`
- `src/app/(admin)/admin/categories/page.tsx`

---

*Last Updated: February 23, 2026*
*Status: ✅ Production Ready*
