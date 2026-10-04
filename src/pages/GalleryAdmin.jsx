import { useState, useEffect, useRef } from 'react';
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
  Play,
  Video,
  LogOut,
  Trash2,
  ImagePlus
} from 'lucide-react';
import initialImagesData from '../../public/imagenes web/imagenes/images_canonical.json';
import initialProductionsData from '../../public/imagenes web/imagenes/productions.json';

const CATEGORIES = [
  'Character Make Up',
  'Horror Fantasy',
  'Old Age',
  'Realistic Bodies',
  'Realistic Animals',
  'Puppets & Animatronics',
  'Blood Wounds',
  'Costumes Masks',
];

const CATEGORY_LABELS = {
  'Character Make Up': 'CHARACTER MAKE UP',
  'Horror Fantasy': 'HORROR AND FANTASY',
  'Old Age': 'OLD AGE',
  'Realistic Bodies': 'REALISTIC BODIES',
  'Realistic Animals': 'REALISTIC ANIMALS',
  'Puppets & Animatronics': 'PUPPETS & ANIMATRONICS',
  'Blood Wounds': 'BLOOD & WOUNDS',
  'Costumes Masks': 'COSTUMES & MASKS',
};

export default function GalleryAdmin() {
  const [gallery, setGallery] = useState([]);
  const [productionsList, setProductionsList] = useState(initialProductionsData || []);
  const [newProductionName, setNewProductionName] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [username, setUsername] = useState(() => sessionStorage.getItem('mfx_admin_username') || 'local_developer'); // Email for Hostinger API
  const [password, setPassword] = useState(() => sessionStorage.getItem('mfx_admin_password') || 'local_mode'); // Password for Hostinger API
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isVerifyingLogin, setIsVerifyingLogin] = useState(false);
  const [loginUserStr, setLoginUserStr] = useState('');
  const [loginPasswordInput, setLoginPasswordInput] = useState('');
  
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' || 
                  window.location.hostname.startsWith('192.168.') ||
                  window.location.hostname.startsWith('10.') ||
                  window.location.port === '5173';

  // Notification states
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4000);
  };

  // State for upload form
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadCategories, setUploadCategories] = useState([]);
  const [uploadProductions, setUploadProductions] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Video Upload States
  const [uploadType, setUploadType] = useState('image'); // 'image' | 'video'
  const [videoSourceType, setVideoSourceType] = useState('link'); // 'link' | 'file'
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [videoFilePreview, setVideoFilePreview] = useState('');
  const [videoThumbnailFile, setVideoThumbnailFile] = useState(null);
  const [videoThumbnailPreview, setVideoThumbnailPreview] = useState('');

  const fileInputRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const editImageInputRef = useRef(null);
  const [editingItem, setEditingItem] = useState(null);

  // Check sessionStorage on mount
  useEffect(() => {
    const savedUser = sessionStorage.getItem('mfx_admin_username');
    const savedPassword = sessionStorage.getItem('mfx_admin_password');
    const savedAuth = sessionStorage.getItem('mfx_admin_authenticated');
    if (savedAuth === 'true' && savedPassword && savedUser) {
      setUsername(savedUser);
      setPassword(savedPassword);
      setIsAuthenticated(true);
    }
  }, []);

  // Initialize gallery state and sort by order
  useEffect(() => {
    const sorted = [...initialImagesData].sort((a, b) => {
      if (a.order == null) return 1;
      if (b.order == null) return -1;
      return a.order - b.order;
    });
    setGallery(sorted);
  }, []);

  // Track if there are differences from the initial data
  useEffect(() => {
    const initialSorted = [...initialImagesData].sort((a, b) => {
      if (a.order == null) return 1;
      if (b.order == null) return -1;
      return a.order - b.order;
    });
    
    const isDifferent = JSON.stringify(gallery) !== JSON.stringify(initialSorted);
    setHasChanges(isDifferent);
  }, [gallery]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginUserStr || !loginPasswordInput) {
      showToast('Por favor, ingresa el usuario y la contraseña.', 'error');
      return;
    }

    setIsVerifyingLogin(true);
    try {
      if (isLocal) {
        sessionStorage.setItem('mfx_admin_username', loginUserStr);
        sessionStorage.setItem('mfx_admin_password', loginPasswordInput);
        sessionStorage.setItem('mfx_admin_authenticated', 'true');
        setUsername(loginUserStr);
        setPassword(loginPasswordInput);
        setIsAuthenticated(true);
        showToast('Acceso local concedido.');
        return;
      }

      // Production verify call
      const response = await fetch('/api.php?action=verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-User': loginUserStr,
          'X-Admin-Password': loginPasswordInput
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Usuario o contraseña incorrectos.');
      }

      sessionStorage.setItem('mfx_admin_username', loginUserStr);
      sessionStorage.setItem('mfx_admin_password', loginPasswordInput);
      sessionStorage.setItem('mfx_admin_authenticated', 'true');
      setUsername(loginUserStr);
      setPassword(loginPasswordInput);
      setIsAuthenticated(true);
      showToast('Sesión iniciada correctamente.');
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setIsVerifyingLogin(false);
    }
  };

  const handleBypassLocal = () => {
    sessionStorage.setItem('mfx_admin_username', 'local_developer');
    sessionStorage.setItem('mfx_admin_password', 'local_mode');
    sessionStorage.setItem('mfx_admin_authenticated', 'true');
    setUsername('local_developer');
    setPassword('local_mode');
    setIsAuthenticated(true);
    showToast('Acceso local concedido en modo desarrollo.');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('mfx_admin_username');
    sessionStorage.removeItem('mfx_admin_password');
    sessionStorage.removeItem('mfx_admin_authenticated');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    showToast('Sesión cerrada correctamente.');
  };

  // Handle file select
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecciona un archivo de imagen válido.', 'error');
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadPreview(reader.result);
    };
    reader.readAsDataURL(file);
    const baseName = file.name.split('.')[0].replace(/[_-]/g, ' ');
    setUploadCaption(baseName.charAt(0).toUpperCase() + baseName.slice(1));
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      showToast('Por favor, selecciona un archivo de video válido.', 'error');
      return;
    }

    setVideoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoFilePreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Auto-populate caption if empty
    if (!uploadCaption) {
      const baseName = file.name.split('.')[0].replace(/[_-]/g, ' ');
      setUploadCaption(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }
  };

  const handleThumbnailFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecciona un archivo de imagen válido.', 'error');
      return;
    }

    setVideoThumbnailFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoThumbnailPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Toggle category on upload form
  const toggleUploadCategory = (cat) => {
    if (uploadCategories.includes(cat)) {
      setUploadCategories(uploadCategories.filter(c => c !== cat));
    } else {
      setUploadCategories([...uploadCategories, cat]);
    }
  };

  const toggleUploadProduction = (prod) => {
    if (uploadProductions.includes(prod)) {
      setUploadProductions(uploadProductions.filter(p => p !== prod));
    } else {
      setUploadProductions([...uploadProductions, prod]);
    }
  };

  const uploadRawFile = async (file, base64Preview) => {
    const base64Data = base64Preview.split(',')[1];
    const payload = {
      filename: file.name,
      base64Data,
      raw: true
    };

    const url = isLocal ? '/api/upload' : '/api.php?action=upload';
    const headers = { 'Content-Type': 'application/json' };
    if (!isLocal) {
      headers['X-Admin-User'] = username;
      headers['X-Admin-Password'] = password;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error del servidor (${response.status})`);
    }

    const resData = await response.json();
    if (resData.error) throw new Error(resData.error);
    return resData.data; // contains { src_url, filename }
  };

  // Perform upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!isLocal && (!username || !password)) {
      showToast('Por favor, introduce el usuario y contraseña de administrador para realizar cambios en producción.', 'error');
      return;
    }

    setIsUploading(true);

    try {
      if (uploadType === 'image') {
        // --- Standard Image Upload ---
        if (!uploadFile) {
          showToast('Selecciona una imagen primero.', 'error');
          setIsUploading(false);
          return;
        }

        const base64Data = uploadPreview.split(',')[1];
        const payload = {
          filename: uploadFile.name,
          base64Data,
          hover_caption: uploadCaption,
          categories: uploadCategories,
          productions: uploadProductions
        };

        const url = isLocal ? '/api/upload' : '/api.php?action=upload';
        const headers = { 'Content-Type': 'application/json' };
        if (!isLocal) {
          headers['X-Admin-User'] = username;
          headers['X-Admin-Password'] = password;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Error del servidor (${response.status})`);
        }

        const resData = await response.json();
        if (resData.error) throw new Error(resData.error);

        const newEntry = resData.data;
        setGallery(prev => [...prev, newEntry].sort((a, b) => (a.order || 0) - (b.order || 0)));
        
        // Reset image upload fields
        setUploadFile(null);
        setUploadPreview('');
        setUploadCaption('');
        setUploadCategories([]);
        setUploadProductions([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        showToast('Imagen subida y agregada con éxito a la gallery.');

      } else {
        // --- Video Upload ---
        if (!videoThumbnailFile) {
          showToast('Es obligatorio subir una miniatura de portada para el video.', 'error');
          setIsUploading(false);
          return;
        }

        let finalVideoUrl = '';
        let videoTypeVal = 'local';

        if (videoSourceType === 'link') {
          if (!videoUrl) {
            showToast('Ingresa el enlace del video.', 'error');
            setIsUploading(false);
            return;
          }
          finalVideoUrl = videoUrl;
          videoTypeVal = videoUrl.includes('vimeo.com') ? 'vimeo' : (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) ? 'youtube' : 'local';
        } else {
          // Upload local video file
          if (!videoFile) {
            showToast('Selecciona el archivo de video a subir.', 'error');
            setIsUploading(false);
            return;
          }
          showToast('Subiendo archivo de video (esto puede tardar unos momentos)...');
          const uploadedVideoData = await uploadRawFile(videoFile, videoFilePreview);
          finalVideoUrl = uploadedVideoData.src_url;
          videoTypeVal = 'local';
        }

        // Upload thumbnail image
        showToast('Subiendo miniatura de portada...');
        const uploadedThumbData = await uploadRawFile(videoThumbnailFile, videoThumbnailPreview);

        // Compute new order
        const maxOrder = gallery.reduce((max, img) => {
          const o = typeof img.order === 'number' ? img.order : parseInt(img.order) || 0;
          return o > max ? o : max;
        }, 0);

        const newEntry = {
          src_url: uploadedThumbData.src_url,
          filename: uploadedThumbData.filename,
          hover_caption: uploadCaption,
          categories: uploadCategories,
          productions: uploadProductions,
          is_video: true,
          video_url: finalVideoUrl,
          video_type: videoTypeVal,
          order: maxOrder + 1
        };

        // Add to local state
        setGallery(prev => [...prev, newEntry].sort((a, b) => (a.order || 0) - (b.order || 0)));

        // Reset video upload fields
        setVideoUrl('');
        setVideoFile(null);
        setVideoFilePreview('');
        setVideoThumbnailFile(null);
        setVideoThumbnailPreview('');
        setUploadCaption('');
        setUploadCategories([]);
        setUploadProductions([]);
        if (videoFileInputRef.current) videoFileInputRef.current.value = '';
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';

        showToast('Video configurado. No olvides hacer clic en GUARDAR CAMBIOS abajo para persistir el nuevo elemento.');
      }
    } catch (err) {
      console.error(err);
      showToast(`Error al subir: ${err.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Save changes to images_canonical.json
  const handleSaveChanges = async () => {
    if (!isLocal && (!username || !password)) {
      showToast('Por favor, introduce el usuario y contraseña de administrador para guardar los cambios en producción.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const normalized = gallery.map((item, idx) => ({
        ...item,
        order: idx + 1
      }));

      const url = isLocal ? '/api/gallery' : '/api.php?action=gallery';
      const headers = { 'Content-Type': 'application/json' };
      if (!isLocal) {
        headers['X-Admin-User'] = username;
        headers['X-Admin-Password'] = password;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(normalized)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error del servidor (${response.status})`);
      }

      const resData = await response.json();
      if (resData.error) throw new Error(resData.error);

      setGallery(normalized);
      showToast('Los cambios se guardaron con éxito.');
    } catch (err) {
      console.error(err);
      showToast(`Error al guardar cambios: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset gallery to disk state
  const handleResetChanges = () => {
    if (window.confirm('¿Estás seguro de que deseas descartar todos los cambios no guardados?')) {
      const sorted = [...initialImagesData].sort((a, b) => {
        if (a.order == null) return 1;
        if (b.order == null) return -1;
        return a.order - b.order;
      });
      setGallery(sorted);
      showToast('Cambios descartados.');
    }
  };



  // Reorder functions
  const moveItem = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= filteredItems.length) return;

    // Find the actual indices in the full gallery array
    const itemA = filteredItems[index];
    const itemB = filteredItems[newIndex];

    const fullIndexA = gallery.findIndex(item => item.filename === itemA.filename);
    const fullIndexB = gallery.findIndex(item => item.filename === itemB.filename);

    if (fullIndexA === -1 || fullIndexB === -1) return;

    // Swap items in the full gallery list
    const updatedGallery = [...gallery];
    const temp = updatedGallery[fullIndexA];
    updatedGallery[fullIndexA] = updatedGallery[fullIndexB];
    updatedGallery[fullIndexB] = temp;

    // Recalculate orders based on new positions
    const reordered = updatedGallery.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));

    setGallery(reordered);
  };

  const moveToExtreme = (index, toEnd) => {
    const itemToMove = filteredItems[index];
    const fullIndex = gallery.findIndex(item => item.filename === itemToMove.filename);
    if (fullIndex === -1) return;

    const updatedGallery = [...gallery];
    const [removed] = updatedGallery.splice(fullIndex, 1);
    
    if (toEnd) {
      updatedGallery.push(removed);
    } else {
      updatedGallery.unshift(removed);
    }

    const reordered = updatedGallery.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));

    setGallery(reordered);
  };

  const handleDeleteImage = (item) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar esta imagen de la galería? Esta acción no se puede deshacer y se aplicará cuando guardes los cambios.\n\n${item.filename}`)) {
      const updatedGallery = gallery.filter(i => i.filename !== item.filename);
      const reordered = updatedGallery.map((i, idx) => ({ ...i, order: idx + 1 }));
      setGallery(reordered);
      showToast(`Imagen eliminada: ${item.filename}. No olvides hacer clic en GUARDAR CAMBIOS.`);
    }
  };

  const handleEditImageClick = (item) => {
    setEditingItem(item);
    if (editImageInputRef.current) {
      editImageInputRef.current.click();
    }
  };

  const handleEditImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !editingItem) return;
    
    // Check credentials if prod
    if (!isLocal && (!username || !password)) {
      showToast('Por favor, introduce usuario y contraseña.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setIsUploading(true);
        const { src_url, filename } = await uploadRawFile(file, reader.result);
        
        const updated = gallery.map(i => {
          if (i.filename === editingItem.filename) {
            return { ...i, src_url, filename }; 
          }
          return i;
        });
        setGallery(updated);
        showToast('Imagen reemplazada. ¡No olvides hacer clic en GUARDAR CAMBIOS!');
      } catch (err) {
        console.error(err);
        showToast(`Error al reemplazar imagen: ${err.message}`, 'error');
      } finally {
        setIsUploading(false);
        setEditingItem(null);
        if (editImageInputRef.current) editImageInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // Direct order input change
  const handleOrderChange = (item, newOrderStr) => {
    let newOrder = parseInt(newOrderStr);
    if (isNaN(newOrder) || newOrder < 1) return;
    if (newOrder > gallery.length) newOrder = gallery.length;

    const currentIdx = gallery.findIndex(i => i.filename === item.filename);
    if (currentIdx === -1) return;

    const updatedGallery = [...gallery];
    const [removed] = updatedGallery.splice(currentIdx, 1);
    
    // Insert at new index (0-indexed)
    updatedGallery.splice(newOrder - 1, 0, removed);

    const reordered = updatedGallery.map((i, idx) => ({
      ...i,
      order: idx + 1
    }));

    setGallery(reordered);
  };

  // Toggle item visibility
  const handleToggleVisibility = (item) => {
    const updated = gallery.map(i => {
      if (i.filename === item.filename) {
        const currentlyHidden = i.hidden === true;
        return { ...i, hidden: !currentlyHidden };
      }
      return i;
    });
    setGallery(updated);
    const itemNowHidden = updated.find(i => i.filename === item.filename)?.hidden;
    showToast(itemNowHidden ? 'Imagen oculta (no se verá en la web).' : 'Imagen visible en la web.');
  };

  // Update item caption
  const handleCaptionChange = (item, val) => {
    const updated = gallery.map(i => {
      if (i.filename === item.filename) {
        return { ...i, hover_caption: val };
      }
      return i;
    });
    setGallery(updated);
  };

  // Toggle category on item
  const toggleItemCategory = (item, cat) => {
    const updated = gallery.map(i => {
      if (i.filename === item.filename) {
        const cats = i.categories || [];
        const newCats = cats.includes(cat)
          ? cats.filter(c => c !== cat)
          : [...cats, cat];
        return { ...i, categories: newCats };
      }
      return i;
    });
    setGallery(updated);
  };

  const toggleItemProduction = (item, prod) => {
    const updated = gallery.map(i => {
      if (i.filename === item.filename) {
        const prods = i.productions || [];
        const newProds = prods.includes(prod)
          ? prods.filter(p => p !== prod)
          : [...prods, prod];
        return { ...i, productions: newProds };
      }
      return i;
    });
    setGallery(updated);
    setHasChanges(true);
  };

  // Production management
  const handleAddProduction = async () => {
    if (!newProductionName.trim()) return;
    const pName = newProductionName.trim();
    if (productionsList.includes(pName)) {
      showToast('Esta producción ya existe.', 'error');
      return;
    }
    
    const newList = [...productionsList, pName];
    await saveProductionsList(newList);
  };

  const handleDeleteProduction = async (prod) => {
    if (window.confirm(`¿Seguro que deseas eliminar la producción "${prod}"?`)) {
      const newList = productionsList.filter(p => p !== prod);
      await saveProductionsList(newList);
    }
  };

  const saveProductionsList = async (newList) => {
    const url = isLocal ? '/api/productions' : '/api.php?action=productions';
    const headers = { 'Content-Type': 'application/json' };
    if (!isLocal) {
      headers['X-Admin-User'] = username;
      headers['X-Admin-Password'] = password;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(newList)
      });
      if (!response.ok) throw new Error('Error al guardar producciones');
      setProductionsList(newList);
      setNewProductionName('');
      showToast('Lista de producciones actualizada.');
    } catch (err) {
      console.error(err);
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  // Filter gallery items
  const filteredItems = gallery.filter(item => {
    const matchesSearch = item.hover_caption?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.filename?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategoryFilter === 'All') return matchesSearch;
    return matchesSearch && item.categories?.includes(selectedCategoryFilter);
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#e5e5e5] flex items-center justify-center relative font-['Crimson_Text'] px-6">
        <div className="grain-overlay"></div>

        {/* Toast Notification */}
        <div className={`fixed top-6 right-6 z-[1100] max-w-sm rounded border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 transform ${
          toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        } ${
          toast.type === 'error' 
            ? 'bg-red-950/80 border-red-900 text-red-200' 
            : 'bg-neutral-900/80 border-red-900/40 text-neutral-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-red-500 animate-pulse' : 'bg-red-700'}`}></div>
            <p className="text-xs uppercase font-['Oswald'] tracking-wider leading-none">{toast.type === 'error' ? 'Error' : 'Notificación'}</p>
          </div>
          <p className="mt-2 text-sm italic">{toast.message}</p>
        </div>

        <div className="bg-[#090909] border border-neutral-900 p-8 rounded-lg shadow-2xl max-w-md w-full relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-950 to-transparent"></div>
          <h2 className="text-2xl font-bold uppercase tracking-widest text-white mb-2 font-['Oswald']">MFX MEXICO</h2>
          <p className="text-xs uppercase tracking-widest text-red-700 font-['Oswald'] mb-8">Acceso Panel de Control</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-neutral-500 font-['Oswald'] mb-2 text-left">
                Usuario (Email)
              </label>
              <input
                type="email"
                value={loginUserStr}
                onChange={(e) => setLoginUserStr(e.target.value)}
                placeholder="maquillajefxmexico@gmail.com"
                className="w-full bg-[#0d0d0d] border border-neutral-900 hover:border-neutral-800 focus:border-red-950 focus:outline-none p-3 text-center text-sm text-white rounded font-sans transition-colors mb-4"
                required
              />

              <label className="block text-xs uppercase tracking-widest text-neutral-500 font-['Oswald'] mb-2 text-left">
                Contraseña
              </label>
              <input
                type="password"
                value={loginPasswordInput}
                onChange={(e) => setLoginPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0d0d0d] border border-neutral-900 hover:border-neutral-800 focus:border-red-950 focus:outline-none p-3 text-center text-sm text-white rounded font-sans transition-colors"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isVerifyingLogin}
              className="w-full py-3 text-xs font-bold uppercase tracking-widest border border-red-950 bg-red-950/20 text-white hover:bg-red-900 hover:border-red-700 transition-all duration-500 font-['Oswald'] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isVerifyingLogin ? <Loader2 size={14} className="animate-spin text-white" /> : 'INGRESAR'}
            </button>
          </form>

          {isLocal && (
            <button
              onClick={handleBypassLocal}
              className="mt-4 text-xs font-['Oswald'] text-neutral-500 hover:text-neutral-300 underline uppercase tracking-wider block mx-auto transition-colors cursor-pointer"
            >
              Acceder sin contraseña (Modo Local)
            </button>
          )}

          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-['Oswald'] text-neutral-600 hover:text-neutral-400 uppercase tracking-widest transition-colors"
            >
              <ArrowLeft size={12} /> Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] pb-32 relative font-['Crimson_Text']">
      <div className="grain-overlay"></div>

      {/* Toast Notification */}
      <div className={`fixed top-6 right-6 z-[1100] max-w-sm rounded border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 transform ${
        toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      } ${
        toast.type === 'error' 
          ? 'bg-red-950/80 border-red-900 text-red-200' 
          : 'bg-neutral-900/80 border-red-900/40 text-neutral-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-red-500 animate-pulse' : 'bg-red-700'}`}></div>
          <p className="text-xs uppercase font-['Oswald'] tracking-wider leading-none">{toast.type === 'error' ? 'Error' : 'Notificación'}</p>
        </div>
        <p className="mt-2 text-sm italic">{toast.message}</p>
      </div>

      {/* Header */}
      <header className="pf-header border-b border-neutral-900 py-8 px-6 bg-gradient-to-b from-[#0d0d0d] to-[#050505] relative">
        <div className="max-w-7xl mx-auto flex justify-between items-center mb-4">
          <Link to="/gallery" className="pf-back text-[#555] hover:text-red-600 flex items-center gap-2 font-['Oswald'] font-bold tracking-widest text-xs">
            <ArrowLeft size={14} /> VOLVER A LA GALERÍA
          </Link>
          <button 
            onClick={handleLogout}
            className="px-4 py-1.5 border border-red-950 bg-red-950/20 text-white hover:bg-red-900 hover:border-red-700 rounded transition-all duration-300 font-['Oswald'] text-xs font-bold tracking-widest cursor-pointer flex items-center gap-2"
          >
            <LogOut size={12} /> CERRAR SESIÓN
          </button>
        </div>
        <h1 className="pf-title text-4xl md:text-6xl font-black text-center mt-4">ADMINISTRADOR DE GALERÍA</h1>
        <p className="text-center italic text-neutral-500 mt-2 text-sm md:text-base">
          Arrastra imágenes, reordena trabajos y administra las categorías en tiempo real.
        </p>

        {/* Stats Section */}
        <div className="max-w-4xl mx-auto mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
          <div className="bg-[#0b0b0b] border border-neutral-900 p-4 rounded text-center">
            <span className="block text-xs uppercase tracking-widest text-neutral-500 font-['Oswald']">TOTAL IMÁGENES</span>
            <span className="text-2xl font-bold font-['Oswald'] text-white mt-1 block">{gallery.length}</span>
          </div>
          <div className="bg-[#0b0b0b] border border-neutral-900 p-4 rounded text-center">
            <span className="block text-xs uppercase tracking-widest text-neutral-500 font-['Oswald']">CATEGORIZADAS</span>
            <span className="text-2xl font-bold font-['Oswald'] text-red-800 mt-1 block">
              {gallery.filter(i => i.categories && i.categories.length > 0).length}
            </span>
          </div>
          <div className="bg-[#0b0b0b] border border-neutral-900 p-4 rounded text-center col-span-2 md:col-span-2">
            <span className="block text-xs uppercase tracking-widest text-neutral-500 font-['Oswald']">CATEGORÍA PRINCIPAL</span>
            <span className="text-sm font-bold font-['Oswald'] text-neutral-300 mt-2 block truncate">
              {(() => {
                const counts = {};
                gallery.forEach(img => {
                  (img.categories || []).forEach(c => {
                    counts[c] = (counts[c] || 0) + 1;
                  });
                });
                const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
                return sorted.length > 0 ? `${CATEGORY_LABELS[sorted[0][0]]} (${sorted[0][1]})` : 'Ninguna';
              })()}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Upload Panel */}
        <section className="lg:col-span-1">
          <div className="bg-[#090909] border border-neutral-900 p-6 rounded-lg shadow-xl relative overflow-hidden group hover:border-neutral-800 transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-950 to-transparent"></div>
            
            <div className="mb-8 border-b border-neutral-900 pb-8">
              <h2 className="text-xl font-bold uppercase tracking-wider text-white mb-6 font-['Oswald'] flex items-center gap-2">
                Gestión de Producciones
              </h2>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newProductionName}
                  onChange={(e) => setNewProductionName(e.target.value)}
                  placeholder="Nueva producción..."
                  className="flex-1 bg-[#0d0d0d] border border-neutral-900 focus:border-red-950 focus:outline-none p-2 text-sm text-white rounded font-sans transition-colors"
                />
                <button 
                  type="button"
                  onClick={handleAddProduction}
                  className="px-4 py-2 bg-red-950/20 border border-red-950 text-white text-xs font-bold uppercase tracking-wider font-['Oswald'] hover:bg-red-900 transition-colors"
                >
                  Agregar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {productionsList.map(prod => (
                  <div key={prod} className="flex items-center gap-1 bg-neutral-900/40 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-300">
                    <span>{prod}</span>
                    <button 
                      onClick={() => handleDeleteProduction(prod)}
                      className="text-neutral-500 hover:text-red-400"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="text-xl font-bold uppercase tracking-wider text-white mb-6 font-['Oswald'] flex items-center gap-2">
              <Upload size={18} className="text-red-700" /> subir nuevo trabajo
            </h2>

            {/* Type Selector (Image / Video) */}
            <div className="flex border-b border-neutral-900 mb-6">
              <button
                type="button"
                onClick={() => setUploadType('image')}
                className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest font-['Oswald'] transition-colors cursor-pointer ${
                  uploadType === 'image' 
                    ? 'text-white border-b-2 border-red-700' 
                    : 'text-neutral-600 hover:text-neutral-400'
                }`}
              >
                Imagen
              </button>
              <button
                type="button"
                onClick={() => setUploadType('video')}
                className={`flex-1 pb-3 text-xs font-bold uppercase tracking-widest font-['Oswald'] transition-colors cursor-pointer ${
                  uploadType === 'video' 
                    ? 'text-white border-b-2 border-red-700' 
                    : 'text-neutral-600 hover:text-neutral-400'
                }`}
              >
                Video
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-6">
              
              {uploadType === 'image' ? (
                /* --- Image Dropzone --- */
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-[#0d0d0d]/40 ${
                    uploadPreview ? 'border-red-900/60 bg-red-950/5' : 'border-neutral-800 hover:border-red-950 hover:bg-red-950/5'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden" 
                  />

                  {uploadPreview ? (
                    <div className="relative w-full aspect-video rounded overflow-hidden bg-black flex items-center justify-center">
                      <img src={uploadPreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFile(null);
                          setUploadPreview('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 bg-black/80 hover:bg-red-900 border border-neutral-800 p-1 rounded-full text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Upload size={32} className="mx-auto text-neutral-600 mb-3 group-hover:text-red-800 transition-colors" />
                      <p className="text-sm font-semibold text-neutral-300 uppercase font-['Oswald'] tracking-wider">Seleccionar Imagen</p>
                      <p className="text-xs text-neutral-500 mt-2">Arrastra tu archivo aquí o haz clic para buscar</p>
                    </div>
                  )}
                </div>
              ) : (
                /* --- Video Fields --- */
                <div className="space-y-6">
                  {/* Radio Source Selector */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest text-neutral-500 font-['Oswald']">
                      Origen del Video
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 text-xs text-neutral-300 font-sans cursor-pointer">
                        <input 
                          type="radio" 
                          name="videoSourceType" 
                          checked={videoSourceType === 'link'} 
                          onChange={() => setVideoSourceType('link')}
                          className="accent-red-700"
                        />
                        Enlace (YouTube / Vimeo)
                      </label>
                      <label className="flex items-center gap-2 text-xs text-neutral-300 font-sans cursor-pointer">
                        <input 
                          type="radio" 
                          name="videoSourceType" 
                          checked={videoSourceType === 'file'} 
                          onChange={() => setVideoSourceType('file')}
                          className="accent-red-700"
                        />
                        Subir archivo de video
                      </label>
                    </div>
                  </div>

                  {videoSourceType === 'link' ? (
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-neutral-400 font-['Oswald'] mb-2">
                        Enlace del Video (YouTube o Vimeo)
                      </label>
                      <input 
                        type="url" 
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="ej. https://vimeo.com/9564883" 
                        className="w-full bg-[#0d0d0d] border border-neutral-900 hover:border-neutral-800 focus:border-red-950 focus:outline-none p-3 text-sm text-white rounded font-sans transition-colors"
                        required={uploadType === 'video' && videoSourceType === 'link'}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-neutral-400 font-['Oswald'] mb-2">
                        Archivo de Video (.mp4, .webm)
                      </label>
                      <div 
                        onClick={() => videoFileInputRef.current?.click()}
                        className={`border border-dashed rounded p-6 text-center cursor-pointer transition-all duration-300 bg-[#0d0d0d]/40 ${
                          videoFile ? 'border-red-900/60 bg-red-950/5' : 'border-neutral-800 hover:border-red-950 hover:bg-red-950/5'
                        }`}
                      >
                        <input 
                          type="file" 
                          ref={videoFileInputRef}
                          onChange={handleVideoFileChange}
                          accept="video/*"
                          className="hidden" 
                        />
                        <Video size={28} className="mx-auto text-neutral-600 mb-2" />
                        <span className="text-xs text-neutral-400 font-sans truncate block max-w-[200px] mx-auto font-bold">
                          {videoFile ? videoFile.name : 'Seleccionar Video'}
                        </span>
                        <p className="text-[10px] text-neutral-500 mt-1">Formatos de video recomendados: MP4, WebM</p>
                      </div>
                    </div>
                  )}

                  {/* Thumbnail Selector (Mandatory for Video) */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-400 font-['Oswald'] mb-2">
                      Miniatura / Portada (Obligatoria)
                    </label>
                    <div 
                      onClick={() => thumbnailInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-[#0d0d0d]/40 ${
                        videoThumbnailPreview ? 'border-red-900/60 bg-red-950/5' : 'border-neutral-800 hover:border-red-950 hover:bg-red-950/5'
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={thumbnailInputRef}
                        onChange={handleThumbnailFileChange}
                        accept="image/*"
                        className="hidden" 
                      />

                      <input 
                        type="file" 
                        ref={editImageInputRef}
                        onChange={handleEditImageFileChange}
                        accept="image/*"
                        className="hidden" 
                      />

                      {videoThumbnailPreview ? (
                        <div className="relative w-full aspect-video rounded overflow-hidden bg-black flex items-center justify-center">
                          <img src={videoThumbnailPreview} alt="Thumbnail Preview" className="max-h-full max-w-full object-contain" />
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVideoThumbnailFile(null);
                              setVideoThumbnailPreview('');
                              if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
                            }}
                            className="absolute top-2 right-2 bg-black/80 hover:bg-red-900 border border-neutral-800 p-1 rounded-full text-white transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <Upload size={24} className="mx-auto text-neutral-600 mb-2" />
                          <p className="text-xs font-semibold text-neutral-300 uppercase font-['Oswald'] tracking-wider">Subir Miniatura</p>
                          <p className="text-[10px] text-neutral-500 mt-1">Imagen que se mostrará en la galería</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 font-['Oswald'] mb-2">
                  Título / Leyenda (Español/Inglés)
                </label>
                <input 
                  type="text" 
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="ej. “Mal de ojo” Film 2022" 
                  className="w-full bg-[#0d0d0d] border border-neutral-900 hover:border-neutral-800 focus:border-red-950 focus:outline-none p-3 text-sm text-white rounded font-sans transition-colors"
                  required
                />
              </div>

              {/* Category Toggles */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 font-['Oswald'] mb-3">
                  Categorías asociadas
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => {
                    const isSelected = uploadCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleUploadCategory(cat)}
                        className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 border rounded-full transition-all duration-300 font-['Oswald'] cursor-pointer ${
                          isSelected 
                            ? 'bg-red-950/40 border-red-800 text-white shadow-glow'
                            : 'bg-transparent border-neutral-900 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
                        }`}
                      >
                        {CATEGORY_LABELS[cat]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 font-['Oswald'] mb-3">
                  Producciones asociadas
                </label>
                <div className="flex flex-wrap gap-2">
                  {productionsList.map(prod => {
                    const isSelected = uploadProductions.includes(prod);
                    return (
                      <button
                        key={prod}
                        type="button"
                        onClick={() => toggleUploadProduction(prod)}
                        className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 border rounded transition-all duration-300 font-['Oswald'] cursor-pointer ${
                          isSelected 
                            ? 'bg-red-950/40 border-red-800 text-white shadow-glow'
                            : 'bg-transparent border-neutral-900 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
                        }`}
                      >
                        {prod}
                      </button>
                    );
                  })}
                  {productionsList.length === 0 && <span className="text-xs text-neutral-600 italic">No hay producciones. Agrégalas arriba.</span>}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isUploading || (uploadType === 'image' ? !uploadFile : (!videoThumbnailFile || (videoSourceType === 'link' ? !videoUrl : !videoFile)))}
                className={`w-full py-4 text-xs font-bold uppercase tracking-widest border transition-all duration-500 font-['Oswald'] flex items-center justify-center gap-2 ${
                  isUploading || (uploadType === 'image' ? !uploadFile : (!videoThumbnailFile || (videoSourceType === 'link' ? !videoUrl : !videoFile)))
                    ? 'border-neutral-900 bg-neutral-900/10 text-neutral-600 cursor-not-allowed'
                    : 'border-red-950 bg-red-950/20 text-white hover:bg-red-900 hover:border-red-700 cursor-pointer shadow-lg hover:shadow-red-950/30'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-white" /> SUBIENDO TRABAJO...
                  </>
                ) : (
                  uploadType === 'image' ? 'SUBIR Y AGREGAR A LA GALERÍA' : 'AGREGAR VIDEO A LA GALERÍA'
                )}
              </button>

            </form>
          </div>
        </section>

        {/* Right Column: Manage & Reorder List */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-[#090909] border border-neutral-900 p-6 rounded-lg shadow-xl relative">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-950 to-transparent"></div>
            
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-6 mb-6">
              <h2 className="text-xl font-bold uppercase tracking-wider text-white font-['Oswald']">
                Administrar Orden
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-grow">
                  <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar leyenda o nombre de archivo..."
                    className="bg-[#0d0d0d] border border-neutral-900 hover:border-neutral-800 focus:border-red-950 focus:outline-none pl-9 pr-4 py-2 text-xs text-white rounded font-sans w-full sm:w-64 transition-colors"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-[#0d0d0d] border border-neutral-900 hover:border-neutral-800 focus:border-red-950 focus:outline-none px-3 py-2 text-xs text-neutral-400 rounded font-['Oswald'] tracking-wider uppercase"
                >
                  <option value="All">TODAS LAS CATEGORÍAS</option>
                  <option value="Videos">VIDEOS</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List Header */}
            <div className="text-xs uppercase tracking-widest text-neutral-500 font-['Oswald'] flex items-center px-4 py-2 border-b border-neutral-900 bg-neutral-950/20 mb-2">
              <div className="w-12 text-center">Orden</div>
              <div className="w-16 ml-4">Miniatura</div>
              <div className="flex-grow ml-6">Detalles de la Imagen / Video</div>
              <div className="w-32 text-right">Controles de Orden</div>
            </div>

            {/* Items Container */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 italic">
                  No se encontraron trabajos con los filtros seleccionados.
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  // Find index in main gallery list
                  const fullIndex = gallery.findIndex(g => g.filename === item.filename);
                  
                  return (
                    <article 
                      key={item.filename}
                      className={`bg-[#0b0b0b] hover:bg-[#0e0e0e] border border-neutral-950 hover:border-neutral-900/60 p-4 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 ${
                        item.hidden ? 'opacity-40 border-dashed border-red-950/40 bg-black/40' : ''
                      }`}
                    >
                      {/* Order Input */}
                      <div className="flex items-center gap-1 w-full sm:w-auto">
                        <span className="text-xs font-['Oswald'] text-neutral-500 uppercase mr-2 sm:hidden">Orden:</span>
                        <input 
                          type="number"
                          value={fullIndex + 1}
                          onChange={(e) => handleOrderChange(item, e.target.value)}
                          className="w-12 bg-black border border-neutral-900 text-center py-1.5 text-xs text-white rounded font-sans focus:outline-none focus:border-red-950 font-bold"
                          min="1"
                          max={gallery.length}
                        />
                        <span className="text-[10px] text-neutral-600 sm:hidden">de {gallery.length}</span>
                      </div>

                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded overflow-hidden bg-black flex-shrink-0 border border-neutral-900 relative group/thumb">
                        <img 
                          src={item.src_url} 
                          alt="Thumb" 
                          className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-500" 
                          onError={(e) => {
                            e.target.src = `/imagenes web/imagenes/${item.filename}`;
                          }}
                        />
                        {item.is_video && (
                          <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center">
                            <Play size={16} fill="white" className="text-white" />
                          </div>
                        )}
                      </div>

                      {/* Details & Inline Edit */}
                      <div className="flex-grow space-y-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                          <input 
                            type="text"
                            value={item.hover_caption || ''}
                            onChange={(e) => handleCaptionChange(item, e.target.value)}
                            className={`w-full bg-transparent border-b border-transparent hover:border-neutral-800 focus:border-red-950 focus:outline-none pb-0.5 text-sm font-semibold text-white tracking-wide font-sans transition-colors ${
                              item.hidden ? 'line-through text-neutral-500' : ''
                            }`}
                            placeholder="Sin leyenda..."
                          />
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-neutral-600 font-mono select-all truncate block max-w-xs">{item.filename}</span>
                            {item.hidden && (
                              <span className="text-[8px] bg-red-950/60 border border-red-900/60 text-red-400 px-1.5 py-0.5 rounded font-['Oswald'] uppercase tracking-wider font-bold leading-none">
                                Oculto en Web
                              </span>
                            )}
                            {item.is_video && (
                              <span className="text-[8px] bg-red-700 border border-red-600 text-white px-1.5 py-0.5 rounded font-['Oswald'] uppercase tracking-wider font-bold leading-none">
                                VIDEO ({item.video_type})
                              </span>
                            )}
                          </div>

                          {item.is_video && (
                            <div className="text-[10px] text-neutral-500 font-sans truncate max-w-xs md:max-w-md">
                              URL: <span className="text-red-400 select-all">{item.video_url}</span>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-1 mt-1">
                            {CATEGORIES.map(cat => {
                              const isSelected = (item.categories || []).includes(cat);
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => toggleItemCategory(item, cat)}
                                  title={`Alternar ${CATEGORY_LABELS[cat]}`}
                                  className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded transition-all duration-300 font-['Oswald'] cursor-pointer ${
                                    isSelected 
                                      ? 'bg-red-950/60 border-red-800 text-white'
                                      : 'bg-transparent border-neutral-900 text-neutral-600 hover:border-neutral-700 hover:text-neutral-400'
                                  }`}
                                >
                                  {CATEGORY_LABELS[cat]}
                                </button>
                              );
                            })}
                          </div>
                          {productionsList.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {productionsList.map(prod => {
                                const isSelected = (item.productions || []).includes(prod);
                                return (
                                  <button
                                    key={prod}
                                    type="button"
                                    onClick={() => toggleItemProduction(item, prod)}
                                    title={`Alternar ${prod}`}
                                    className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded transition-all duration-300 font-['Oswald'] cursor-pointer ${
                                      isSelected 
                                        ? 'bg-red-950/60 border-red-800 text-white'
                                        : 'bg-transparent border-neutral-900 text-neutral-600 hover:border-neutral-700 hover:text-neutral-400'
                                    }`}
                                  >
                                    {prod}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1 self-end sm:self-center w-full sm:w-auto justify-end border-t border-neutral-900 pt-3 sm:border-0 sm:pt-0">
                        {/* Extreme Up */}
                        <button 
                          onClick={() => moveToExtreme(idx, false)}
                          disabled={idx === 0}
                          title="Enviar al Inicio"
                          className="p-1.5 rounded bg-[#0d0d0d] hover:bg-[#1a1a1a] text-neutral-500 hover:text-white border border-neutral-900 disabled:opacity-20 disabled:hover:bg-[#0d0d0d] disabled:hover:text-neutral-500 transition-colors"
                        >
                          <ChevronsUp size={14} />
                        </button>
                        {/* One Up */}
                        <button 
                          onClick={() => moveItem(idx, -1)}
                          disabled={idx === 0}
                          title="Subir"
                          className="p-1.5 rounded bg-[#0d0d0d] hover:bg-[#1a1a1a] text-neutral-500 hover:text-white border border-neutral-900 disabled:opacity-20 disabled:hover:bg-[#0d0d0d] disabled:hover:text-neutral-500 transition-colors"
                        >
                          <ChevronUp size={14} />
                        </button>
                        {/* One Down */}
                        <button 
                          onClick={() => moveItem(idx, 1)}
                          disabled={idx === filteredItems.length - 1}
                          title="Bajar"
                          className="p-1.5 rounded bg-[#0d0d0d] hover:bg-[#1a1a1a] text-neutral-500 hover:text-white border border-neutral-900 disabled:opacity-20 disabled:hover:bg-[#0d0d0d] disabled:hover:text-neutral-500 transition-colors"
                        >
                          <ChevronDown size={14} />
                        </button>
                        {/* Extreme Down */}
                        <button 
                          onClick={() => moveToExtreme(idx, true)}
                          disabled={idx === filteredItems.length - 1}
                          title="Enviar al Final"
                          className="p-1.5 rounded bg-[#0d0d0d] hover:bg-[#1a1a1a] text-neutral-500 hover:text-white border border-neutral-900 disabled:opacity-20 disabled:hover:bg-[#0d0d0d] disabled:hover:text-neutral-500 transition-colors"
                        >
                          <ChevronsDown size={14} />
                        </button>
                        {/* Toggle Visibility (Eye / EyeOff) */}
                        <button 
                          onClick={() => handleToggleVisibility(item)}
                          title={item.hidden ? "Mostrar en la web" : "Ocultar en la web"}
                          className={`p-1.5 rounded border transition-colors ml-2 ${
                            item.hidden 
                              ? 'bg-red-950/20 border-red-900 text-red-400 hover:bg-red-900 hover:text-white' 
                              : 'bg-[#0d0d0d] border-neutral-900 text-neutral-500 hover:text-white hover:border-neutral-700'
                          }`}
                        >
                          {item.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        {/* Edit Image */}
                        <button 
                          onClick={() => handleEditImageClick(item)}
                          title="Reemplazar Imagen/Miniatura"
                          className="p-1.5 rounded border border-neutral-900 bg-[#0d0d0d] text-neutral-500 hover:bg-neutral-800 hover:text-white transition-colors ml-1"
                        >
                          <ImagePlus size={14} />
                        </button>
                        {/* Delete Item */}
                        <button 
                          onClick={() => handleDeleteImage(item)}
                          title="Eliminar de la galería"
                          className="p-1.5 rounded border border-neutral-900 bg-[#0d0d0d] text-neutral-500 hover:bg-red-950 hover:text-red-400 hover:border-red-900 transition-colors ml-1"
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
        </section>

      </main>

      {/* Floating Bottom Save Bar */}
      <footer className="fixed bottom-0 left-0 w-full z-[1000] bg-[#090909]/95 border-t border-red-950/30 backdrop-blur-md py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${hasChanges ? 'bg-red-600 animate-pulse shadow-glow' : 'bg-neutral-800'}`}></div>
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500 font-['Oswald'] leading-tight">Estado de la Galería</p>
            <p className="text-sm italic text-neutral-200 mt-0.5">
              {hasChanges ? 'Hay cambios sin guardar en el orden o detalles.' : 'Sin cambios pendientes.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          {/* Session indicator for Production (Hostinger) */}
          {!isLocal ? (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-[10px] text-neutral-600 font-['Oswald'] tracking-widest uppercase">Sesión activa:</span>
              <span className="text-xs font-semibold text-neutral-300 font-sans">{username}</span>
            </div>
          ) : (
            <span className="text-[10px] text-neutral-600 font-['Oswald'] tracking-widest mr-2 uppercase">Modo Local (Autoguardado)</span>
          )}

          {/* Reset button */}
          {hasChanges && (
            <button
              onClick={handleResetChanges}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest bg-transparent hover:bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded transition-all duration-300 font-['Oswald']"
            >
              DESCARTAR CAMBIOS
            </button>
          )}



          {/* Save Changes Button */}
          <button
            onClick={handleSaveChanges}
            disabled={isSaving || !hasChanges}
            className={`px-8 py-2.5 text-xs font-bold uppercase tracking-widest border rounded transition-all duration-300 font-['Oswald'] flex items-center gap-2 ${
              isSaving || !hasChanges
                ? 'border-neutral-900 bg-neutral-900/10 text-neutral-600 cursor-not-allowed'
                : 'border-red-700 bg-red-950/40 text-white hover:bg-red-900 shadow-lg hover:shadow-red-900/20 cursor-pointer'
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
