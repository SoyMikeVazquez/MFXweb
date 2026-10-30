import { useState, useEffect, useRef, Component } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Eye,
  EyeOff,
  Search,
  Check,
  Loader2,
  LogOut,
  Trash2,
  Folder,
  FolderOpen,
  FolderPlus,
  Plus,
  Edit2,
  GripVertical,
  Film,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import initialProductionsData from '../../public/imagenes web/imagenes/productions.json';
import { supabase } from '../lib/supabaseClient';

/**
 * Normaliza la estructura de productions.json para garantizar que cada Producción (Carpeta)
 * tenga su arreglo `orders` (Subcarpetas / Órdenes), y cada Orden tenga su arreglo `images`.
 */
const normalizeProductionsData = (rawList) => {
  if (!Array.isArray(rawList)) return [];

  return rawList
    .map((item, prodIdx) => {
      if (typeof item === 'string') {
        const name = item.trim();
        if (!name) return null;
        return {
          name,
          description: '',
          order: prodIdx + 1,
          orders: []
        };
      }

      const name = (item?.name || '').trim();
      if (!name) return null;

      // Si ya viene con estructura `orders` (Subcarpetas)
      if (Array.isArray(item.orders)) {
        const orders = item.orders
          .map((ord, ordIdx) => {
            const ordName = (typeof ord === 'string' ? ord : ord?.name || '').trim();
            if (!ordName) return null;
            const rawImgs = Array.isArray(ord?.images) ? ord.images : [];
            const images = rawImgs
              .filter(img => img && (img.src_url || img.filename))
              .map((img, imgIdx) => ({
                src_url: img.src_url || `/imagenes web/imagenes/${img.filename}`,
                filename: img.filename || img.src_url?.split('/').pop() || `img_${imgIdx + 1}.jpg`,
                hover_caption: img.hover_caption || name,
                folder: ordName,
                order: idxToOrder(img.order, imgIdx),
                hidden: img.hidden === true
              }));
            return {
              name: ordName,
              order: ordIdx + 1,
              images
            };
          })
          .filter(Boolean);

        return {
          name,
          description: item.description || '',
          order: prodIdx + 1,
          orders
        };
      }

      // Migración automática desde formato anterior (`folders` + `images`)
      const legacyFolderNames = Array.isArray(item.folders)
        ? item.folders
        : Array.isArray(item.categories)
        ? item.categories
        : [];

      const legacyImages = Array.isArray(item.images) ? item.images : [];
      const ordersMap = new Map();

      legacyFolderNames.forEach((fName) => {
        const clean = String(fName || '').trim();
        if (clean && !ordersMap.has(clean)) {
          ordersMap.set(clean, []);
        }
      });

      legacyImages.forEach((img, imgIdx) => {
        if (!img || (!img.src_url && !img.filename)) return;
        const targetFolder =
          (img.folder && String(img.folder).trim()) ||
          (Array.isArray(img.categories) && img.categories[0] ? String(img.categories[0]).trim() : '') ||
          (ordersMap.size > 0 ? Array.from(ordersMap.keys())[0] : 'Orden 1');

        if (!ordersMap.has(targetFolder)) {
          ordersMap.set(targetFolder, []);
        }

        ordersMap.get(targetFolder).push({
          src_url: img.src_url || `/imagenes web/imagenes/${img.filename}`,
          filename: img.filename || img.src_url?.split('/').pop() || `img_${imgIdx + 1}.jpg`,
          hover_caption: img.hover_caption || name,
          folder: targetFolder,
          order: ordersMap.get(targetFolder).length + 1,
          hidden: img.hidden === true
        });
      });

      const orders = Array.from(ordersMap.entries()).map(([ordName, imgs], ordIdx) => ({
        name: ordName,
        order: ordIdx + 1,
        images: imgs.map((im, i) => ({ ...im, folder: ordName, order: i + 1 }))
      }));

      return {
        name,
        description: item.description || '',
        order: prodIdx + 1,
        orders
      };
    })
    .filter(Boolean);
};

function idxToOrder(val, fallbackIdx) {
  return typeof val === 'number' && !Number.isNaN(val) ? val : fallbackIdx + 1;
}

/**
 * Serializa la lista de Producciones manteniendo tanto `orders` (estructura jerárquica de subcarpetas)
 * como `folders` e `images` aplanados para compatibilidad directa con la vista pública de galería.
 */
const serializeProductionsForSave = (productionsList) => {
  return productionsList.map((prod, prodIdx) => {
    const cleanOrders = (prod.orders || []).map((ord, ordIdx) => {
      const cleanImages = (ord.images || []).map((img, imgIdx) => ({
        src_url: img.src_url || '',
        filename: img.filename || '',
        hover_caption: (img.hover_caption || '').trim() || `${prod.name} - ${ord.name}`,
        folder: ord.name,
        categories: [ord.name],
        order: imgIdx + 1,
        hidden: img.hidden === true
      }));
      return {
        name: ord.name,
        order: ordIdx + 1,
        images: cleanImages
      };
    });

    const folders = cleanOrders.map(o => o.name);
    let globalOrder = 1;
    const flattenedImages = [];
    cleanOrders.forEach(ord => {
      ord.images.forEach(img => {
        flattenedImages.push({
          ...img,
          folder: ord.name,
          categories: [ord.name],
          order: globalOrder++
        });
      });
    });

    return {
      name: prod.name,
      description: prod.description || '',
      order: prodIdx + 1,
      orders: cleanOrders,
      folders,
      categories: folders,
      images: flattenedImages
    };
  });
};

function ProductionsAdminContent() {
  // Estado principal de Producciones (Carpetas)
  const [productions, setProductions] = useState(() => normalizeProductionsData(initialProductionsData));
  const [selectedProdName, setSelectedProdName] = useState(() => {
    const norm = normalizeProductionsData(initialProductionsData);
    return norm[0]?.name || '';
  });
  const [selectedOrderName, setSelectedOrderName] = useState(() => {
    const norm = normalizeProductionsData(initialProductionsData);
    return norm[0]?.orders?.[0]?.name || '';
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Inputs para crear Producción (Carpeta) y Orden (Subcarpeta)
  const [newProdInput, setNewProdInput] = useState('');
  const [newOrderInput, setNewOrderInput] = useState('');

  // Modales de renombrado
  const [renamingProd, setRenamingProd] = useState(null); // { oldName, newName }
  const [renamingOrder, setRenamingOrder] = useState(null); // { oldName, newName }

  // Subida de múltiples imágenes (solo imágenes)
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadPreviews, setUploadPreviews] = useState([]);
  const [uploadCaption, setUploadCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Búsqueda y Drag & Drop para reordenar imágenes
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // Autenticación
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [username, setUsername] = useState(() => sessionStorage.getItem('mfx_admin_username') || '');
  const [password, setPassword] = useState(() => sessionStorage.getItem('mfx_admin_password') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifyingLogin, setIsVerifyingLogin] = useState(false);
  const [loginUserStr, setLoginUserStr] = useState('');
  const [loginPasswordInput, setLoginPasswordInput] = useState('');

  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.port === '5173';

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
      headers['X-Supabase-Token'] = session.access_token;
    }
    if (username) headers['X-Admin-User'] = username;
    if (password) headers['X-Admin-Password'] = password;
    return headers;
  };

  // Notificaciones Toast
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4000);
  };

  // Verificar sesión al montar
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (isMounted && data?.session && !error) {
            setSession(data.session);
            setIsAuthenticated(true);
            const userEmail = data.session.user?.email || '';
            setUsername(userEmail);
            sessionStorage.setItem('mfx_admin_authenticated', 'true');
            sessionStorage.setItem('mfx_admin_username', userEmail);
            setAuthLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Error al verificar sesión de Supabase:', err);
        }
      }

      const savedAuth = sessionStorage.getItem('mfx_admin_authenticated');
      if (savedAuth === 'true') {
        setUsername(sessionStorage.getItem('mfx_admin_username') || (isLocal ? 'local_developer' : ''));
        setPassword(sessionStorage.getItem('mfx_admin_password') || (isLocal ? 'local_mode' : ''));
        setIsAuthenticated(true);
      }
      if (isMounted) setAuthLoading(false);
    }

    checkAuth();

    let subscription = null;
    if (supabase) {
      const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        if (newSession) {
          setIsAuthenticated(true);
          const email = newSession.user?.email || '';
          setUsername(email);
          sessionStorage.setItem('mfx_admin_authenticated', 'true');
          sessionStorage.setItem('mfx_admin_username', email);
        }
      });
      subscription = listener?.subscription;
    }

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
    };
  }, [isLocal]);

  // Cargar producciones frescas desde el servidor al montar
  useEffect(() => {
    const fetchUrl = isLocal
      ? '/api/productions?t=' + Date.now()
      : '/api.php?action=get_productions&t=' + Date.now();

    fetch(fetchUrl)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (Array.isArray(data)) {
          const norm = normalizeProductionsData(data);
          setProductions(norm);
          if (norm.length > 0) {
            setSelectedProdName(prev => {
              const targetProd = norm.find(p => p.name === prev) || norm[0];
              setSelectedOrderName(prevOrd => {
                if (targetProd.orders.some(o => o.name === prevOrd)) return prevOrd;
                return targetProd.orders[0]?.name || '';
              });
              return targetProd.name;
            });
          }
        }
      })
      .catch(() => {});
  }, [isLocal]);

  // Mantener sincronizada la Orden seleccionada cuando cambia la Producción
  const activeProd = productions.find(p => p.name === selectedProdName) || null;
  const activeOrders = activeProd ? activeProd.orders || [] : [];
  const activeOrder = activeOrders.find(o => o.name === selectedOrderName) || null;
  const activeImages = activeOrder ? activeOrder.images || [] : [];

  useEffect(() => {
    if (!activeProd) {
      if (productions.length > 0) {
        setSelectedProdName(productions[0].name);
        setSelectedOrderName(productions[0].orders?.[0]?.name || '');
      } else {
        setSelectedProdName('');
        setSelectedOrderName('');
      }
      return;
    }
    if (activeProd.orders.length > 0 && !activeProd.orders.some(o => o.name === selectedOrderName)) {
      setSelectedOrderName(activeProd.orders[0].name);
    } else if (activeProd.orders.length === 0 && selectedOrderName !== '') {
      setSelectedOrderName('');
    }
  }, [selectedProdName, productions, activeProd, selectedOrderName]);

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginUserStr || !loginPasswordInput) return;
    setIsVerifyingLogin(true);

    try {
      const cleanEmail = loginUserStr.trim();

      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: loginPasswordInput
        });

        if (!error && data?.session) {
          setSession(data.session);
          setUsername(data.user?.email || cleanEmail);
          setPassword(loginPasswordInput);
          setIsAuthenticated(true);
          sessionStorage.setItem('mfx_admin_authenticated', 'true');
          sessionStorage.setItem('mfx_admin_username', data.user?.email || cleanEmail);
          sessionStorage.setItem('mfx_admin_password', loginPasswordInput);
          showToast('Sesión iniciada correctamente con Supabase.');
          setIsVerifyingLogin(false);
          return;
        }
      }

      if (!isLocal) {
        const response = await fetch('/api.php?action=verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-User': cleanEmail,
            'X-Admin-Password': loginPasswordInput
          }
        });
        if (response.ok) {
          setUsername(cleanEmail);
          setPassword(loginPasswordInput);
          setIsAuthenticated(true);
          sessionStorage.setItem('mfx_admin_authenticated', 'true');
          sessionStorage.setItem('mfx_admin_username', cleanEmail);
          sessionStorage.setItem('mfx_admin_password', loginPasswordInput);
          showToast('Sesión iniciada correctamente.');
          setIsVerifyingLogin(false);
          return;
        }
      }

      throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.');
    } catch (err) {
      showToast(err.message || 'Error al iniciar sesión.', 'error');
    } finally {
      setIsVerifyingLogin(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Error cerrando sesión de Supabase:', err);
      }
    }
    setSession(null);
    sessionStorage.removeItem('mfx_admin_authenticated');
    sessionStorage.removeItem('mfx_admin_username');
    sessionStorage.removeItem('mfx_admin_password');
    setUsername('');
    setPassword('');
    setIsAuthenticated(false);
    setLoginUserStr('');
    setLoginPasswordInput('');
  };

  // Guardar en productions.json
  const persistProductions = async (nextList, successMsg = 'Cambios guardados en Producciones.') => {
    setIsSaving(true);
    const payload = serializeProductionsForSave(nextList);
    const url = isLocal ? '/api/productions' : '/api.php?action=productions';
    const headers = isLocal ? { 'Content-Type': 'application/json' } : getAuthHeaders();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'No se pudieron guardar los cambios en el servidor.');
      }

      const normalized = normalizeProductionsData(payload);
      setProductions(normalized);
      setHasChanges(false);
      if (successMsg) showToast(successMsg);
      return true;
    } catch (err) {
      showToast(err.message || 'Error al guardar producciones.', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════════
   * 1. ACCIONES DE PRODUCCIONES (CARPETAS PRINCIPALES)
   * ═══════════════════════════════════════════════════════════════════════════ */
  const handleCreateProduction = async (e) => {
    e.preventDefault();
    const clean = newProdInput.trim();
    if (!clean) return;

    if (productions.some(p => p.name.toLowerCase() === clean.toLowerCase())) {
      showToast('Ya existe una Producción (Carpeta) con ese nombre.', 'error');
      return;
    }

    const defaultFirstOrder = {
      name: 'Orden 1',
      order: 1,
      images: []
    };

    const newProd = {
      name: clean,
      description: '',
      order: productions.length + 1,
      orders: [defaultFirstOrder]
    };

    const nextList = [...productions, newProd];
    setNewProdInput('');
    setSelectedProdName(clean);
    setSelectedOrderName(defaultFirstOrder.name);
    await persistProductions(nextList, `Producción "${clean}" creada con su primera subcarpeta "Orden 1".`);
  };

  const handleRenameProduction = async (e) => {
    e?.preventDefault?.();
    if (!renamingProd) return;
    const oldName = renamingProd.oldName;
    const cleanNew = renamingProd.newName.trim();

    if (!cleanNew || cleanNew === oldName) {
      setRenamingProd(null);
      return;
    }

    if (
      productions.some(
        p => p.name.toLowerCase() === cleanNew.toLowerCase() && p.name !== oldName
      )
    ) {
      showToast('Ya existe otra Producción con ese nombre.', 'error');
      return;
    }

    const nextList = productions.map(p => (p.name === oldName ? { ...p, name: cleanNew } : p));
    setRenamingProd(null);
    if (selectedProdName === oldName) setSelectedProdName(cleanNew);
    await persistProductions(nextList, `Producción renombrada a "${cleanNew}".`);
  };

  const handleMoveProduction = async (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= productions.length) return;
    const copy = [...productions];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    const reordered = copy.map((p, i) => ({ ...p, order: i + 1 }));
    await persistProductions(reordered, 'Orden de Producciones actualizado.');
  };

  const handleDeleteProduction = async (prodName) => {
    if (
      !window.confirm(
        `¿Estás seguro de eliminar la Producción (Carpeta) "${prodName}" junto con todas sus Órdenes (Subcarpetas) e imágenes?`
      )
    ) {
      return;
    }

    const nextList = productions.filter(p => p.name !== prodName);
    if (selectedProdName === prodName) {
      const nextActive = nextList[0] || null;
      setSelectedProdName(nextActive?.name || '');
      setSelectedOrderName(nextActive?.orders?.[0]?.name || '');
    }
    await persistProductions(nextList, `Producción "${prodName}" eliminada.`);
  };

  /* ═══════════════════════════════════════════════════════════════════════════
   * 2. ACCIONES DE ÓRDENES (SUBCARPETAS DENTRO DE LA PRODUCCIÓN ACTIVA)
   * ═══════════════════════════════════════════════════════════════════════════ */
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!activeProd) {
      showToast('Primero selecciona o crea una Producción (Carpeta).', 'error');
      return;
    }

    const clean = newOrderInput.trim();
    if (!clean) return;

    if (activeOrders.some(o => o.name.toLowerCase() === clean.toLowerCase())) {
      showToast('Ya existe una Orden (Subcarpeta) con ese nombre en esta Producción.', 'error');
      return;
    }

    const newOrd = {
      name: clean,
      order: activeOrders.length + 1,
      images: []
    };

    const nextList = productions.map(p =>
      p.name === activeProd.name ? { ...p, orders: [...p.orders, newOrd] } : p
    );

    setNewOrderInput('');
    setSelectedOrderName(clean);
    await persistProductions(nextList, `Orden (Subcarpeta) "${clean}" creada en ${activeProd.name}.`);
  };

  const handleRenameOrder = async (e) => {
    e?.preventDefault?.();
    if (!renamingOrder || !activeProd) return;
    const oldName = renamingOrder.oldName;
    const cleanNew = renamingOrder.newName.trim();

    if (!cleanNew || cleanNew === oldName) {
      setRenamingOrder(null);
      return;
    }

    if (
      activeOrders.some(
        o => o.name.toLowerCase() === cleanNew.toLowerCase() && o.name !== oldName
      )
    ) {
      showToast('Ya existe otra Orden (Subcarpeta) con ese nombre en esta Producción.', 'error');
      return;
    }

    const nextList = productions.map(p => {
      if (p.name !== activeProd.name) return p;
      const updatedOrders = p.orders.map(o => {
        if (o.name !== oldName) return o;
        return {
          ...o,
          name: cleanNew,
          images: (o.images || []).map(img => ({ ...img, folder: cleanNew }))
        };
      });
      return { ...p, orders: updatedOrders };
    });

    setRenamingOrder(null);
    if (selectedOrderName === oldName) setSelectedOrderName(cleanNew);
    await persistProductions(nextList, `Orden renombrada a "${cleanNew}".`);
  };

  const handleMoveOrder = async (idx, direction) => {
    if (!activeProd) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= activeOrders.length) return;

    const copy = [...activeOrders];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    const reordered = copy.map((o, i) => ({ ...o, order: i + 1 }));

    const nextList = productions.map(p =>
      p.name === activeProd.name ? { ...p, orders: reordered } : p
    );
    await persistProductions(nextList, 'Orden de Subcarpetas actualizado.');
  };

  const handleDeleteOrder = async (orderName) => {
    if (!activeProd) return;
    if (
      !window.confirm(
        `¿Eliminar la Orden (Subcarpeta) "${orderName}" y sus imágenes dentro de "${activeProd.name}"?`
      )
    ) {
      return;
    }

    const updatedOrders = activeOrders.filter(o => o.name !== orderName);
    const nextList = productions.map(p =>
      p.name === activeProd.name ? { ...p, orders: updatedOrders } : p
    );

    if (selectedOrderName === orderName) {
      setSelectedOrderName(updatedOrders[0]?.name || '');
    }
    await persistProductions(nextList, `Orden "${orderName}" eliminada.`);
  };

  /* ═══════════════════════════════════════════════════════════════════════════
   * 3. SUBIDA DE IMÁGENES (UNA O VARIAS, SOLO IMÁGENES)
   * ═══════════════════════════════════════════════════════════════════════════ */
  const handleFilesSelected = (e) => {
    const rawFiles = Array.from(e.target.files || []);
    const validImageFiles = rawFiles.filter(f => f.type && f.type.startsWith('image/'));

    if (validImageFiles.length < rawFiles.length) {
      showToast('Solo se permiten archivos de imagen (.jpg, .png, .webp, etc.).', 'error');
    }

    if (validImageFiles.length === 0) return;

    // Liberar URLs previas
    uploadPreviews.forEach(url => URL.revokeObjectURL(url));
    const previews = validImageFiles.map(file => URL.createObjectURL(file));
    setUploadFiles(validImageFiles);
    setUploadPreviews(previews);
  };

  const handleRemoveSelectedFile = (idxToRemove) => {
    URL.revokeObjectURL(uploadPreviews[idxToRemove]);
    const nextFiles = uploadFiles.filter((_, idx) => idx !== idxToRemove);
    const nextPreviews = uploadPreviews.filter((_, idx) => idx !== idxToRemove);
    setUploadFiles(nextFiles);
    setUploadPreviews(nextPreviews);
    if (nextFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearSelectedFiles = () => {
    uploadPreviews.forEach(url => URL.revokeObjectURL(url));
    setUploadFiles([]);
    setUploadPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!activeProd) {
      showToast('Selecciona o crea una Producción (Carpeta) primero.', 'error');
      return;
    }
    if (!activeOrder) {
      showToast('Selecciona o crea una Orden (Subcarpeta) donde subir las imágenes.', 'error');
      return;
    }
    if (uploadFiles.length === 0) {
      showToast('Selecciona al menos una imagen para subir.', 'error');
      return;
    }

    setIsUploading(true);
    const uploadedEntries = [];
    const uploadEndpoint = isLocal ? '/api/upload' : '/api.php?action=upload';
    const headers = isLocal ? { 'Content-Type': 'application/json' } : getAuthHeaders();

    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const safeProdPrefix = activeProd.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        const safeOrdPrefix = activeOrder.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFilename = `${safeProdPrefix}_${safeOrdPrefix}_${Date.now()}_${i + 1}_${cleanFileName}`;

        const res = await fetch(uploadEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            filename: uniqueFilename,
            base64Data,
            target: 'productions',
            raw: true
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error subiendo imagen ${file.name}`);
        }

        const result = await res.json();
        const defaultCaption =
          uploadCaption.trim() ||
          `${activeProd.name} - ${activeOrder.name}`;

        uploadedEntries.push({
          src_url: result?.data?.src_url || `/imagenes web/producciones/${uniqueFilename}`,
          filename: result?.data?.filename || uniqueFilename,
          hover_caption: defaultCaption,
          folder: activeOrder.name,
          order: activeImages.length + uploadedEntries.length + 1,
          hidden: false
        });
      }

      const nextList = productions.map(p => {
        if (p.name !== activeProd.name) return p;
        return {
          ...p,
          orders: p.orders.map(o => {
            if (o.name !== activeOrder.name) return o;
            const merged = [...(o.images || []), ...uploadedEntries].map((im, idx) => ({
              ...im,
              order: idx + 1
            }));
            return { ...o, images: merged };
          })
        };
      });

      clearSelectedFiles();
      setUploadCaption('');
      await persistProductions(
        nextList,
        `${uploadedEntries.length} imagen(es) subida(s) a "${activeOrder.name}".`
      );
    } catch (err) {
      showToast(err.message || 'Error al subir las imágenes.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════════
   * 4. REORDENAMIENTO Y EDICIÓN DE IMÁGENES DENTRO DE LA ORDEN ACTIVA
   * ═══════════════════════════════════════════════════════════════════════════ */
  const updateActiveOrderImages = (newImages, markDirty = true) => {
    if (!activeProd || !activeOrder) return [];
    const reindexed = newImages.map((img, i) => ({
      ...img,
      folder: activeOrder.name,
      order: i + 1
    }));

    const nextList = productions.map(p => {
      if (p.name !== activeProd.name) return p;
      return {
        ...p,
        orders: p.orders.map(o => (o.name === activeOrder.name ? { ...o, images: reindexed } : o))
      };
    });

    setProductions(nextList);
    if (markDirty) setHasChanges(true);
    return nextList;
  };

  const handleMoveImageStep = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= activeImages.length) return;
    const copy = [...activeImages];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    updateActiveOrderImages(copy, true);
  };

  const handleMoveImageExtreme = (index, toBottom) => {
    if (activeImages.length <= 1) return;
    const copy = [...activeImages];
    const [moved] = copy.splice(index, 1);
    if (toBottom) {
      copy.push(moved);
    } else {
      copy.unshift(moved);
    }
    updateActiveOrderImages(copy, true);
  };

  const handleDirectOrderNumberChange = (index, newNumberStr) => {
    const parsed = parseInt(newNumberStr, 10);
    if (Number.isNaN(parsed)) return;
    const clampedIdx = Math.max(0, Math.min(activeImages.length - 1, parsed - 1));
    if (clampedIdx === index) return;

    const copy = [...activeImages];
    const [moved] = copy.splice(index, 1);
    copy.splice(clampedIdx, 0, moved);
    updateActiveOrderImages(copy, true);
  };

  // Drag & Drop handlers para ordenar imágenes arrastrando
  const handleDragStart = (idx) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (dragOverIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDrop = (idx) => {
    if (draggedIdx === null || draggedIdx === idx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const copy = [...activeImages];
    const [moved] = copy.splice(draggedIdx, 1);
    copy.splice(idx, 0, moved);
    setDraggedIdx(null);
    setDragOverIdx(null);
    updateActiveOrderImages(copy, true);
  };

  const handleCaptionChange = (index, newCaption) => {
    const copy = activeImages.map((img, idx) =>
      idx === index ? { ...img, hover_caption: newCaption } : img
    );
    updateActiveOrderImages(copy, true);
  };

  const handleToggleImageHidden = (index) => {
    const copy = activeImages.map((img, idx) =>
      idx === index ? { ...img, hidden: !img.hidden } : img
    );
    updateActiveOrderImages(copy, true);
  };

  const handleMoveImageToAnotherOrder = async (index, targetOrderName) => {
    if (!activeProd || !activeOrder || !targetOrderName || targetOrderName === activeOrder.name) {
      return;
    }

    const imageToMove = activeImages[index];
    if (!imageToMove) return;

    const nextList = productions.map(p => {
      if (p.name !== activeProd.name) return p;
      return {
        ...p,
        orders: p.orders.map(o => {
          if (o.name === activeOrder.name) {
            const remaining = o.images
              .filter((_, i) => i !== index)
              .map((im, i) => ({ ...im, order: i + 1 }));
            return { ...o, images: remaining };
          }
          if (o.name === targetOrderName) {
            const added = [
              ...(o.images || []),
              { ...imageToMove, folder: targetOrderName, order: (o.images?.length || 0) + 1 }
            ];
            return { ...o, images: added };
          }
          return o;
        })
      };
    });

    await persistProductions(
      nextList,
      `Imagen movida a la Orden (Subcarpeta) "${targetOrderName}".`
    );
  };

  const handleDeleteImage = async (index) => {
    const img = activeImages[index];
    if (!img) return;
    if (!window.confirm(`¿Eliminar esta imagen de la Orden "${activeOrder?.name}"?`)) return;

    const remaining = activeImages
      .filter((_, i) => i !== index)
      .map((im, i) => ({ ...im, order: i + 1 }));

    const nextList = productions.map(p => {
      if (p.name !== activeProd.name) return p;
      return {
        ...p,
        orders: p.orders.map(o => (o.name === activeOrder.name ? { ...o, images: remaining } : o))
      };
    });

    await persistProductions(nextList, 'Imagen eliminada.');
  };

  // Filtrado por búsqueda dentro de la Orden activa
  const displayedImages = activeImages
    .map((img, originalIdx) => ({ ...img, originalIdx }))
    .filter(item => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.hover_caption?.toLowerCase().includes(q) ||
        item.filename?.toLowerCase().includes(q)
      );
    });

  const totalProductionsCount = productions.length;
  const totalOrdersCount = productions.reduce((acc, p) => acc + (p.orders?.length || 0), 0);
  const totalImagesCount = productions.reduce(
    (acc, p) =>
      acc + (p.orders || []).reduce((sum, o) => sum + (o.images?.length || 0), 0),
    0
  );

  /* ─── PANTALLA DE CARGA DE SESIÓN ────────────────────────────────────────── */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
        <Loader2 size={32} className="animate-spin text-red-700 mb-3" />
        <p className="text-xs font-['Oswald'] uppercase tracking-widest text-neutral-400">
          Verificando sesión...
        </p>
      </div>
    );
  }

  /* ─── PANTALLA DE LOGIN ──────────────────────────────────────────────────── */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#e5e5e5] flex flex-col justify-center items-center p-6 relative font-['Crimson_Text']">
        <div className="grain-overlay"></div>

        <div
          className={`fixed top-6 right-6 z-[1100] max-w-sm rounded border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 transform ${
            toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          } ${
            toast.type === 'error'
              ? 'bg-red-950/80 border-red-900 text-red-200'
              : 'bg-neutral-900/80 border-red-900/40 text-neutral-100'
          }`}
        >
          <p className="text-xs uppercase font-['Oswald'] tracking-wider">
            {toast.type === 'error' ? 'Error' : 'Notificación'}
          </p>
          <p className="mt-1 text-sm italic">{toast.message}</p>
        </div>

        <div className="max-w-md w-full bg-[#090909] border border-neutral-900 p-8 rounded-lg shadow-2xl relative z-10 text-center">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-900 to-transparent"></div>
          <Film size={28} className="text-red-700 mx-auto mb-3" />
          <h1 className="text-2xl font-black uppercase tracking-wider text-white mb-2 font-['Oswald']">
            GESTOR DE PRODUCCIONES
          </h1>
          <p className="text-neutral-400 text-sm italic mb-6">
            Inicia sesión con tu cuenta autenticada de Supabase para administrar Producciones y Órdenes.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left">
              <label className="block text-[10px] uppercase font-['Oswald'] tracking-widest text-neutral-400 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={loginUserStr}
                onChange={e => setLoginUserStr(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full bg-[#0d0d0d] border border-neutral-800 focus:border-red-800 focus:outline-none p-3 text-sm text-white rounded font-sans transition-colors"
                required
                autoComplete="email"
              />
            </div>
            <div className="text-left">
              <label className="block text-[10px] uppercase font-['Oswald'] tracking-widest text-neutral-400 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={loginPasswordInput}
                onChange={e => setLoginPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0d0d0d] border border-neutral-800 focus:border-red-800 focus:outline-none p-3 text-sm text-white rounded font-sans transition-colors"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifyingLogin}
              className="w-full py-3.5 text-xs font-bold uppercase tracking-widest border border-red-900 bg-red-950/40 text-white hover:bg-red-900 hover:border-red-700 transition-all duration-300 font-['Oswald'] flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              {isVerifyingLogin ? (
                <Loader2 size={14} className="animate-spin text-white" />
              ) : (
                'INGRESAR A PRODUCCIONES'
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-['Oswald'] text-neutral-500 hover:text-neutral-300 uppercase tracking-widest transition-colors"
            >
              <ArrowLeft size={12} /> Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ─── PANTALLA PRINCIPAL DE GESTIÓN DE PRODUCCIONES ──────────────────────── */
  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] pb-32 relative font-['Crimson_Text']">
      <div className="grain-overlay"></div>

      {/* Toast Notification */}
      <div
        className={`fixed top-6 right-6 z-[1100] max-w-sm rounded border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 transform ${
          toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        } ${
          toast.type === 'error'
            ? 'bg-red-950/90 border-red-800 text-red-200'
            : 'bg-neutral-900/90 border-red-900/50 text-neutral-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2 h-2 rounded-full ${
              toast.type === 'error' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          <p className="text-xs uppercase font-['Oswald'] tracking-wider">
            {toast.type === 'error' ? 'Error' : 'Guardado'}
          </p>
        </div>
        <p className="mt-1.5 text-sm italic">{toast.message}</p>
      </div>

      {/* Header */}
      <header className="border-b border-neutral-900 py-8 px-6 bg-gradient-to-b from-[#0d0d0d] to-[#050505] relative">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-neutral-400 hover:text-red-500 flex items-center gap-2 font-['Oswald'] font-bold tracking-widest text-xs uppercase transition-colors"
            >
              <ArrowLeft size={14} /> INICIO
            </Link>
            <Link
              to="/gallery"
              className="text-neutral-400 hover:text-white flex items-center gap-2 font-['Oswald'] font-bold tracking-widest text-xs uppercase transition-colors"
            >
              VER GALERÍA PÚBLICA
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {username && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-neutral-400 font-sans border-r border-neutral-800 pr-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {username}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 border border-red-950 bg-red-950/20 text-white hover:bg-red-900 hover:border-red-700 rounded transition-all duration-300 font-['Oswald'] text-xs font-bold tracking-widest cursor-pointer flex items-center gap-2"
            >
              <LogOut size={12} /> CERRAR SESIÓN
            </button>
          </div>
        </div>

        <h1 className="pf-title text-3xl md:text-5xl font-black text-center mt-2 uppercase font-['Oswald'] tracking-wider text-white">
          ADMINISTRADOR DE PRODUCCIONES
        </h1>
        <p className="text-center italic text-neutral-400 mt-2 text-sm md:text-base max-w-2xl mx-auto">
          Página independiente para crear <strong className="text-white not-italic">Producciones (Carpetas)</strong>, organizar <strong className="text-white not-italic">Órdenes (Subcarpetas)</strong> y subir o reordenar imágenes.
        </p>

        {/* Contadores rápidos */}
        <div className="max-w-3xl mx-auto mt-6 grid grid-cols-3 gap-4 px-2">
          <div className="bg-[#0b0b0b] border border-neutral-900 p-3.5 rounded text-center">
            <span className="block text-[10px] uppercase tracking-widest text-neutral-500 font-['Oswald']">
              PRODUCCIONES (CARPETAS)
            </span>
            <span className="text-xl md:text-2xl font-bold font-['Oswald'] text-white mt-0.5 block">
              {totalProductionsCount}
            </span>
          </div>
          <div className="bg-[#0b0b0b] border border-neutral-900 p-3.5 rounded text-center">
            <span className="block text-[10px] uppercase tracking-widest text-neutral-500 font-['Oswald']">
              ÓRDENES (SUBCARPETAS)
            </span>
            <span className="text-xl md:text-2xl font-bold font-['Oswald'] text-red-600 mt-0.5 block">
              {totalOrdersCount}
            </span>
          </div>
          <div className="bg-[#0b0b0b] border border-neutral-900 p-3.5 rounded text-center">
            <span className="block text-[10px] uppercase tracking-widest text-neutral-500 font-['Oswald']">
              IMÁGENES SUBIDAS
            </span>
            <span className="text-xl md:text-2xl font-bold font-['Oswald'] text-neutral-300 mt-0.5 block">
              {totalImagesCount}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ─── COLUMNA IZQUIERDA (4 cols): CARPETAS Y SUBCARPETAS ──────────── */}
        <section className="lg:col-span-4 space-y-6">
          {/* PASO 1: PRODUCCIONES (CARPETAS) */}
          <div className="bg-[#090909] border border-neutral-900 p-5 rounded-lg shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-900 to-transparent"></div>

            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold uppercase tracking-wider text-white font-['Oswald'] flex items-center gap-2">
                <Folder size={17} className="text-red-600" /> 1. Producciones (Carpetas)
              </h2>
              <span className="text-[11px] font-['Oswald'] bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                {productions.length}
              </span>
            </div>
            <p className="text-xs text-neutral-500 italic mb-4">
              Crea cada proyecto o producción como una carpeta principal.
            </p>

            {/* Formulario para crear Producción (Carpeta) */}
            <form onSubmit={handleCreateProduction} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newProdInput}
                onChange={e => setNewProdInput(e.target.value)}
                placeholder="Nueva Producción (ej. 100 Años de Soledad)..."
                className="flex-1 bg-[#0d0d0d] border border-neutral-800 focus:border-red-800 focus:outline-none px-3 py-2 text-xs text-white rounded font-sans"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-red-950/60 hover:bg-red-900 border border-red-800 text-white text-xs font-bold uppercase tracking-wider font-['Oswald'] rounded transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus size={14} /> Crear
              </button>
            </form>

            {/* Lista de Producciones */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {productions.length === 0 ? (
                <div className="p-4 border border-dashed border-neutral-900 rounded text-center text-xs text-neutral-500 italic">
                  Aún no hay Producciones creadas. Escribe un nombre arriba y pulsa Crear.
                </div>
              ) : (
                productions.map((prod, idx) => {
                  const isSelected = prod.name === selectedProdName;
                  const subCount = prod.orders?.length || 0;
                  const imgCount = (prod.orders || []).reduce(
                    (s, o) => s + (o.images?.length || 0),
                    0
                  );

                  return (
                    <div
                      key={prod.name}
                      onClick={() => {
                        setSelectedProdName(prod.name);
                        setSelectedOrderName(prod.orders?.[0]?.name || '');
                      }}
                      className={`p-3 rounded border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-red-950/35 border-red-800 text-white shadow-md'
                          : 'bg-[#0d0d0d] border-neutral-900 text-neutral-400 hover:border-neutral-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {isSelected ? (
                          <FolderOpen size={16} className="text-red-500 shrink-0" />
                        ) : (
                          <Folder size={16} className="text-neutral-500 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="font-['Oswald'] text-sm uppercase tracking-wide block truncate">
                            {prod.name}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-sans block">
                            {subCount} {subCount === 1 ? 'orden' : 'órdenes'} • {imgCount}{' '}
                            {imgCount === 1 ? 'imagen' : 'imágenes'}
                          </span>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleMoveProduction(idx, -1)}
                          disabled={idx === 0}
                          title="Subir carpeta"
                          className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveProduction(idx, 1)}
                          disabled={idx === productions.length - 1}
                          title="Bajar carpeta"
                          className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setRenamingProd({ oldName: prod.name, newName: prod.name })
                          }
                          title="Renombrar Producción"
                          className="p-1 text-neutral-500 hover:text-white cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduction(prod.name)}
                          title="Eliminar Producción"
                          className="p-1 text-neutral-500 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* PASO 2: ÓRDENES (SUBCARPETAS) DENTRO DE LA PRODUCCIÓN ACTIVA */}
          <div className="bg-[#090909] border border-neutral-900 p-5 rounded-lg shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-900 to-transparent"></div>

            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold uppercase tracking-wider text-white font-['Oswald'] flex items-center gap-2">
                <Layers size={17} className="text-red-600" /> 2. Órdenes (Subcarpetas)
              </h2>
              <span className="text-[11px] font-['Oswald'] bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                {activeOrders.length}
              </span>
            </div>

            {!activeProd ? (
              <p className="text-xs text-neutral-500 italic py-4">
                Selecciona o crea primero una Producción arriba.
              </p>
            ) : (
              <>
                <p className="text-xs text-neutral-400 italic mb-4">
                  Subcarpetas dentro de{' '}
                  <strong className="text-white not-italic font-['Oswald'] uppercase">
                    {activeProd.name}
                  </strong>
                  :
                </p>

                {/* Formulario para crear Orden (Subcarpeta) */}
                <form onSubmit={handleCreateOrder} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newOrderInput}
                    onChange={e => setNewOrderInput(e.target.value)}
                    placeholder="Nueva Orden (ej. Orden 1, Prótesis, Personajes)..."
                    className="flex-1 bg-[#0d0d0d] border border-neutral-800 focus:border-red-800 focus:outline-none px-3 py-2 text-xs text-white rounded font-sans"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-red-950/60 hover:bg-red-900 border border-red-800 text-white text-xs font-bold uppercase tracking-wider font-['Oswald'] rounded transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <FolderPlus size={14} /> Crear
                  </button>
                </form>

                {/* Lista de Órdenes (Subcarpetas) */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {activeOrders.length === 0 ? (
                    <div className="p-4 border border-dashed border-neutral-900 rounded text-center text-xs text-neutral-500 italic">
                      Esta Producción no tiene Órdenes (Subcarpetas) todavía. Crea una arriba para empezar a subir imágenes.
                    </div>
                  ) : (
                    activeOrders.map((ord, idx) => {
                      const isSelected = ord.name === selectedOrderName;
                      const count = ord.images?.length || 0;

                      return (
                        <div
                          key={ord.name}
                          onClick={() => setSelectedOrderName(ord.name)}
                          className={`p-3 rounded border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-red-950/35 border-red-800 text-white shadow-md'
                              : 'bg-[#0d0d0d] border-neutral-900 text-neutral-400 hover:border-neutral-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-[10px] font-mono bg-black/70 border border-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">
                              #{idx + 1}
                            </span>
                            <div className="truncate">
                              <span className="font-['Oswald'] text-sm uppercase tracking-wide block truncate">
                                {ord.name}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-sans block">
                                {count} {count === 1 ? 'imagen' : 'imágenes'}
                              </span>
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-1 shrink-0"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(idx, -1)}
                              disabled={idx === 0}
                              title="Subir subcarpeta"
                              className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 cursor-pointer"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(idx, 1)}
                              disabled={idx === activeOrders.length - 1}
                              title="Bajar subcarpeta"
                              className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 cursor-pointer"
                            >
                              <ChevronDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setRenamingOrder({ oldName: ord.name, newName: ord.name })
                              }
                              title="Renombrar Orden (Subcarpeta)"
                              className="p-1 text-neutral-500 hover:text-white cursor-pointer"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(ord.name)}
                              title="Eliminar Orden (Subcarpeta)"
                              className="p-1 text-neutral-500 hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ─── COLUMNA DERECHA (8 cols): SUBIDA Y ORDENAMIENTO DE IMÁGENES ─── */}
        <section className="lg:col-span-8 space-y-6">
          {!activeProd ? (
            <div className="bg-[#090909] border border-neutral-900 p-12 rounded-lg text-center space-y-3">
              <Folder size={40} className="text-neutral-700 mx-auto" />
              <h3 className="text-lg font-bold uppercase font-['Oswald'] text-white">
                Comienza creando o seleccionando una Producción (Carpeta)
              </h3>
              <p className="text-sm text-neutral-500 italic max-w-md mx-auto">
                Usa el panel izquierdo para crear una carpeta de Producción y luego sus Órdenes (Subcarpetas).
              </p>
            </div>
          ) : !activeOrder ? (
            <div className="bg-[#090909] border border-neutral-900 p-12 rounded-lg text-center space-y-4">
              <FolderPlus size={40} className="text-red-700 mx-auto" />
              <h3 className="text-lg font-bold uppercase font-['Oswald'] text-white">
                Crea una Orden (Subcarpeta) dentro de "{activeProd.name}"
              </h3>
              <p className="text-sm text-neutral-400 italic max-w-md mx-auto">
                Para mantener las imágenes organizadas, crea una Orden (Subcarpeta) en la sección 2 de la columna izquierda.
              </p>
            </div>
          ) : (
            <>
              {/* BLOQUE SUPERIOR: SUBIR UNA O VARIAS IMÁGENES A LA ORDEN ACTIVA */}
              <div className="bg-[#090909] border border-neutral-900 p-6 rounded-lg shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-900 to-transparent"></div>

                {/* Ruta activa (Breadcrumb) */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-['Oswald'] uppercase tracking-wider text-neutral-400 mb-4 pb-3 border-b border-neutral-900">
                  <span className="inline-flex items-center gap-1.5 text-white bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded">
                    <Folder size={13} className="text-red-600" />
                    {activeProd.name}
                  </span>
                  <span className="text-neutral-600">➔</span>
                  <span className="inline-flex items-center gap-1.5 text-white bg-red-950/40 border border-red-800/70 px-2.5 py-1 rounded">
                    <FolderOpen size={13} className="text-red-400" />
                    Orden: {activeOrder.name}
                  </span>
                </div>

                <h3 className="text-base font-bold uppercase tracking-wider text-white font-['Oswald'] flex items-center gap-2 mb-3">
                  <Upload size={17} className="text-red-600" /> Subir Imágenes a "{activeOrder.name}"
                </h3>

                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Selector de imágenes múltiples */}
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFilesSelected}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-neutral-800 hover:border-red-800 rounded-lg p-5 text-center cursor-pointer transition-all bg-[#0c0c0c] hover:bg-[#101010] min-h-[120px] flex flex-col items-center justify-center"
                      >
                        <ImageIcon size={26} className="text-red-700 mb-2" />
                        <p className="text-xs font-['Oswald'] uppercase tracking-wider text-neutral-200">
                          Haz clic para elegir una o varias imágenes
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-1 font-sans">
                          Solo imágenes (JPG, PNG, WEBP) • Selección múltiple permitida
                        </p>
                      </div>
                    </div>

                    {/* Pie de foto opcional y botón de subida */}
                    <div className="flex flex-col justify-between space-y-3">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-neutral-400 font-['Oswald'] mb-1.5">
                          Título / Pie de foto (Opcional)
                        </label>
                        <input
                          type="text"
                          value={uploadCaption}
                          onChange={e => setUploadCaption(e.target.value)}
                          placeholder={`${activeProd.name} - ${activeOrder.name}`}
                          className="w-full bg-[#0d0d0d] border border-neutral-800 focus:border-red-800 focus:outline-none p-2.5 text-xs text-white rounded font-sans"
                        />
                        <p className="text-[11px] text-neutral-500 italic mt-1">
                          Si lo dejas vacío, se usará el nombre de la Producción y la Orden.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isUploading || uploadFiles.length === 0}
                        className={`w-full py-3 text-xs font-bold uppercase tracking-widest border rounded font-['Oswald'] transition-all flex items-center justify-center gap-2 ${
                          isUploading || uploadFiles.length === 0
                            ? 'border-neutral-900 bg-neutral-900/20 text-neutral-600 cursor-not-allowed'
                            : 'border-red-800 bg-red-950/60 hover:bg-red-900 text-white cursor-pointer shadow-lg'
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 size={14} className="animate-spin text-white" /> SUBIENDO IMÁGENES...
                          </>
                        ) : (
                          <>
                            <Upload size={14} /> SUBIR{' '}
                            {uploadFiles.length > 0 ? `(${uploadFiles.length}) ` : ''}
                            IMAGEN{uploadFiles.length === 1 ? '' : 'ES'} A "{activeOrder.name.toUpperCase()}"
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Vista previa de imágenes seleccionadas para subir */}
                  {uploadPreviews.length > 0 && (
                    <div className="pt-3 border-t border-neutral-900">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-['Oswald'] uppercase tracking-wider text-neutral-400">
                          {uploadPreviews.length} imagen(es) lista(s) para subir:
                        </span>
                        <button
                          type="button"
                          onClick={clearSelectedFiles}
                          className="text-[11px] font-['Oswald'] uppercase text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          Limpiar selección
                        </button>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-1">
                        {uploadPreviews.map((previewUrl, idx) => (
                          <div
                            key={idx}
                            className="relative group aspect-square rounded overflow-hidden border border-neutral-800 bg-black"
                          >
                            <img
                              src={previewUrl}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSelectedFile(idx)}
                              className="absolute top-1 right-1 bg-black/80 hover:bg-red-900 text-white rounded-full p-1 opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Quitar"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* BLOQUE INFERIOR: LISTA VERTICAL PARA ORDENAR IMÁGENES */}
              <div className="bg-[#090909] border border-neutral-900 p-6 rounded-lg shadow-xl relative">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-900 to-transparent"></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-neutral-900">
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-wider text-white font-['Oswald']">
                      Imágenes en "{activeOrder.name}" ({activeImages.length})
                    </h3>
                    <p className="text-xs text-neutral-500 italic">
                      Arrastra las filas, escribe el número de posición o usa las flechas para ordenarlas.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-60">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Buscar imagen en esta Orden..."
                      className="w-full bg-[#0d0d0d] border border-neutral-800 focus:border-red-800 focus:outline-none pl-9 pr-3 py-2 text-xs text-white rounded font-sans"
                    />
                  </div>
                </div>

                {/* Encabezado de columnas */}
                <div className="hidden md:flex items-center text-[11px] uppercase tracking-widest text-neutral-500 font-['Oswald'] px-4 py-2 border-b border-neutral-900 bg-neutral-950/40 mb-2">
                  <div className="w-20 text-center">Orden</div>
                  <div className="w-16 ml-3">Imagen</div>
                  <div className="flex-1 ml-4">Título y Subcarpeta</div>
                  <div className="w-44 text-right">Ordenar / Acciones</div>
                </div>

                {/* Lista estrictamente vertical */}
                <div className="flex flex-col space-y-2.5 max-h-[65vh] overflow-y-auto pr-1 custom-scrollbar">
                  {displayedImages.length === 0 ? (
                    <div className="py-16 text-center text-neutral-500 italic space-y-2">
                      <FolderOpen size={36} className="mx-auto text-neutral-700" />
                      <p className="text-sm">
                        {activeImages.length === 0
                          ? `La Orden "${activeOrder.name}" aún no tiene imágenes. Sube una o varias desde el panel de arriba.`
                          : 'No se encontraron imágenes con esa búsqueda.'}
                      </p>
                    </div>
                  ) : (
                    displayedImages.map(item => {
                      const idx = item.originalIdx;
                      const isDraggingOver = dragOverIdx === idx && draggedIdx !== idx;

                      return (
                        <article
                          key={`${item.filename}-${idx}`}
                          draggable={!searchQuery.trim()}
                          onDragStart={() => handleDragStart(idx)}
                          onDragOver={e => handleDragOver(e, idx)}
                          onDrop={() => handleDrop(idx)}
                          onDragEnd={() => {
                            setDraggedIdx(null);
                            setDragOverIdx(null);
                          }}
                          className={`w-full bg-[#0d0d0d] hover:bg-[#111111] border p-3.5 rounded flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                            isDraggingOver
                              ? 'border-red-600 bg-red-950/20'
                              : 'border-neutral-900 hover:border-neutral-800'
                          } ${item.hidden ? 'opacity-45 border-dashed border-red-950/50' : ''}`}
                        >
                          {/* Manija Drag + Número de orden */}
                          <div className="flex items-center gap-2">
                            <span
                              className="text-neutral-600 hover:text-neutral-300 cursor-grab active:cursor-grabbing p-1"
                              title="Arrastrar para mover"
                            >
                              <GripVertical size={16} />
                            </span>
                            <input
                              type="number"
                              min="1"
                              max={activeImages.length}
                              value={idx + 1}
                              onChange={e => handleDirectOrderNumberChange(idx, e.target.value)}
                              className="w-12 bg-black border border-neutral-800 focus:border-red-800 focus:outline-none text-center py-1.5 text-xs text-white rounded font-sans font-bold"
                              title="Posición en esta Orden"
                            />
                          </div>

                          {/* Miniatura */}
                          <div className="w-16 h-16 rounded overflow-hidden bg-black border border-neutral-800 shrink-0">
                            <img
                              src={item.src_url}
                              alt={item.hover_caption || item.filename}
                              className="w-full h-full object-cover"
                              onError={e => {
                                e.target.src = `/imagenes web/imagenes/${item.filename}`;
                              }}
                            />
                          </div>

                          {/* Título y selector de Subcarpeta (Orden) */}
                          <div className="flex-1 min-w-0 w-full space-y-1.5">
                            <input
                              type="text"
                              value={item.hover_caption || ''}
                              onChange={e => handleCaptionChange(idx, e.target.value)}
                              placeholder="Título de la imagen..."
                              className="w-full bg-transparent border-b border-neutral-800 focus:border-red-800 focus:outline-none pb-1 text-sm font-semibold text-white font-sans"
                            />
                            <div className="flex flex-wrap items-center gap-3 pt-0.5">
                              <span className="text-[10px] text-neutral-500 font-mono truncate max-w-xs">
                                {item.filename}
                              </span>

                              {activeOrders.length > 1 && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-['Oswald'] uppercase text-neutral-500">
                                    Mover a Orden:
                                  </span>
                                  <select
                                    value={activeOrder.name}
                                    onChange={e =>
                                      handleMoveImageToAnotherOrder(idx, e.target.value)
                                    }
                                    className="bg-[#141414] border border-neutral-800 text-neutral-300 text-[11px] rounded px-2 py-0.5 font-sans focus:outline-none focus:border-red-800 cursor-pointer"
                                  >
                                    {activeOrders.map(ord => (
                                      <option key={ord.name} value={ord.name}>
                                        {ord.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {item.hidden && (
                                <span className="text-[9px] bg-red-950/60 border border-red-900 text-red-300 px-1.5 py-0.5 rounded font-['Oswald'] uppercase">
                                  Oculta
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Controles de Ordenamiento y Acciones */}
                          <div className="flex items-center gap-1 self-end md:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveImageExtreme(idx, false)}
                              disabled={idx === 0}
                              title="Enviar al inicio (#1)"
                              className="p-1.5 rounded bg-[#090909] hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 disabled:opacity-20 cursor-pointer"
                            >
                              <ChevronsUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveImageStep(idx, -1)}
                              disabled={idx === 0}
                              title="Subir una posición"
                              className="p-1.5 rounded bg-[#090909] hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 disabled:opacity-20 cursor-pointer"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveImageStep(idx, 1)}
                              disabled={idx === activeImages.length - 1}
                              title="Bajar una posición"
                              className="p-1.5 rounded bg-[#090909] hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 disabled:opacity-20 cursor-pointer"
                            >
                              <ChevronDown size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveImageExtreme(idx, true)}
                              disabled={idx === activeImages.length - 1}
                              title="Enviar al final"
                              className="p-1.5 rounded bg-[#090909] hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 disabled:opacity-20 cursor-pointer"
                            >
                              <ChevronsDown size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleImageHidden(idx)}
                              title={item.hidden ? 'Mostrar en la galería' : 'Ocultar en la galería'}
                              className={`p-1.5 rounded border ml-1 cursor-pointer ${
                                item.hidden
                                  ? 'bg-red-950/30 border-red-900 text-red-400'
                                  : 'bg-[#090909] border-neutral-800 text-neutral-400 hover:text-white'
                              }`}
                            >
                              {item.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteImage(idx)}
                              title="Eliminar imagen"
                              className="p-1.5 rounded border border-neutral-800 bg-[#090909] text-neutral-400 hover:bg-red-950 hover:text-red-300 hover:border-red-900 ml-1 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {/* Modal para renombrar Producción (Carpeta) */}
      {renamingProd && (
        <div className="fixed inset-0 z-[1200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleRenameProduction}
            className="max-w-md w-full bg-[#0a0a0a] border border-neutral-800 rounded-xl p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold uppercase font-['Oswald'] text-white mb-2">
              Renombrar Producción (Carpeta)
            </h3>
            <input
              type="text"
              value={renamingProd.newName}
              onChange={e =>
                setRenamingProd(prev => ({ ...prev, newName: e.target.value }))
              }
              className="w-full bg-[#0d0d0d] border border-neutral-800 focus:border-red-800 focus:outline-none p-3 text-sm text-white rounded font-sans mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenamingProd(null)}
                className="px-4 py-2 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-bold uppercase font-['Oswald'] rounded cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-red-950/70 hover:bg-red-900 border border-red-800 text-white text-xs font-bold uppercase font-['Oswald'] rounded cursor-pointer"
              >
                Guardar Nombre
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal para renombrar Orden (Subcarpeta) */}
      {renamingOrder && (
        <div className="fixed inset-0 z-[1200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleRenameOrder}
            className="max-w-md w-full bg-[#0a0a0a] border border-neutral-800 rounded-xl p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold uppercase font-['Oswald'] text-white mb-2">
              Renombrar Orden (Subcarpeta)
            </h3>
            <input
              type="text"
              value={renamingOrder.newName}
              onChange={e =>
                setRenamingOrder(prev => ({ ...prev, newName: e.target.value }))
              }
              className="w-full bg-[#0d0d0d] border border-neutral-800 focus:border-red-800 focus:outline-none p-3 text-sm text-white rounded font-sans mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenamingOrder(null)}
                className="px-4 py-2 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-bold uppercase font-['Oswald'] rounded cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-red-950/70 hover:bg-red-900 border border-red-800 text-white text-xs font-bold uppercase font-['Oswald'] rounded cursor-pointer"
              >
                Guardar Nombre
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barra inferior flotante para guardar cambios de orden o títulos */}
      <footer className="fixed bottom-0 left-0 w-full z-[1000] bg-[#090909]/95 border-t border-red-950/40 backdrop-blur-md py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              hasChanges ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
            }`}
          />
          <div>
            <p className="text-xs font-['Oswald'] uppercase tracking-wider text-white">
              Estado de Producciones
            </p>
            <p className="text-xs italic text-neutral-400">
              {hasChanges
                ? 'Tienes cambios de orden o títulos pendientes por guardar.'
                : 'Todas las Producciones y Órdenes están sincronizadas.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => persistProductions(productions, 'Orden y cambios guardados correctamente.')}
            disabled={isSaving}
            className={`px-7 py-2.5 text-xs font-bold uppercase tracking-widest border rounded transition-all font-['Oswald'] flex items-center gap-2 cursor-pointer ${
              hasChanges
                ? 'border-red-700 bg-red-900 text-white hover:bg-red-800 shadow-lg'
                : 'border-red-900/60 bg-red-950/30 text-neutral-200 hover:bg-red-900/50'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin text-white" /> GUARDANDO...
              </>
            ) : (
              <>
                <Check size={14} /> GUARDAR CAMBIOS
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}

class ProductionsErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-[#0e0e0e] border border-red-900/60 p-8 rounded-xl max-w-lg">
            <h2 className="text-xl font-bold font-['Oswald'] uppercase text-red-500 mb-3">
              Error en la vista de Producciones
            </h2>
            <p className="text-xs text-neutral-400 mb-6 font-mono bg-black/60 p-3 rounded">
              {this.state.error?.message || 'Error inesperado'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-red-950 border border-red-800 text-white rounded font-['Oswald'] text-xs uppercase cursor-pointer"
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ProductionsAdmin(props) {
  return (
    <ProductionsErrorBoundary>
      <ProductionsAdminContent {...props} />
    </ProductionsErrorBoundary>
  );
}
