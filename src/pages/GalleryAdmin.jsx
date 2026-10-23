import { useState, useEffect, useRef, useMemo } from 'react';
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
  ImagePlus,
  Film,
  LayoutGrid,
  Tag,
  Plus,
  Edit2,
  Folder,
  FolderOpen,
  FolderPlus,
  Link2,
  Unlink,
  Layers,
  Sparkles
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

// Normalize productions to object form { name: string, folders: string[], description?: string, images?: any[] }
const normalizeProductions = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map(item => {
    if (typeof item === 'string') {
      return { name: item, folders: [], categories: [], description: '', images: [] };
    }
    const folders = Array.isArray(item.folders)
      ? item.folders
      : (Array.isArray(item.categories) ? item.categories : []);

    const rawImages = Array.isArray(item.images) ? item.images : [];
    const images = rawImages.map((img, idx) => {
      let folder = img.folder;
      if (!folder && Array.isArray(img.categories) && img.categories.length > 0) {
        folder = img.categories[0];
      }
      return {
        src_url: img.src_url || '',
        filename: img.filename || '',
        hover_caption: img.hover_caption || '',
        folder: folder || '',
        categories: folder ? [folder] : [],
        order: typeof img.order === 'number' ? img.order : idx + 1,
        hidden: img.hidden === true
      };
    });

    return {
      name: item.name || '',
      folders: folders,
      categories: folders, // backward compat
      description: item.description || '',
      images: images
    };
  }).filter(p => p.name.trim().length > 0);
};

export default function GalleryAdmin() {
  const [gallery, setGallery] = useState([]);
  const [productionsList, setProductionsList] = useState(() => normalizeProductions(initialProductionsData));
  const [activeAdminScreen, setActiveAdminScreen] = useState('gallery'); // 'gallery' | 'productions'

  // Productions screen specific states
  const [selectedProdName, setSelectedProdName] = useState(() => {
    const list = normalizeProductions(initialProductionsData);
    return list[0]?.name || '';
  });
  const [newProdNameInput, setNewProdNameInput] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [searchProdQuery, setSearchProdQuery] = useState('');
  const [selectedProdFolderFilter, setSelectedProdFolderFilter] = useState('All');
  const [editingProdName, setEditingProdName] = useState(null); // { oldName, newName }

  // Production batch upload form states
  const [prodUploadFiles, setProdUploadFiles] = useState([]);
  const [prodUploadPreviews, setProdUploadPreviews] = useState([]);
  const [prodUploadCaption, setProdUploadCaption] = useState('');
  const [prodUploadFolder, setProdUploadFolder] = useState('');
  const [isProdUploading, setIsProdUploading] = useState(false);
  const prodFileInputRef = useRef(null);

  // Fetch productions dynamically on mount
  useEffect(() => {
    fetch('/imagenes web/imagenes/productions.json?t=' + Date.now())
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (Array.isArray(data)) {
          const norm = normalizeProductions(data);
          setProductionsList(norm);
          setSelectedProdName(prev => {
            if (norm.some(p => p.name === prev)) return prev;
            return norm[0]?.name || '';
          });
        }
      })
      .catch(() => {});
  }, []);

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
  const [uploadPreviews, setUploadPreviews] = useState([]); // array of preview URLs
  const [uploadFile, setUploadFile] = useState(null); // first selected file for compatibility
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploadFiles, setUploadFiles] = useState([]); // array of File objects
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadCategories, setUploadCategories] = useState([]);
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

  // Handle file select (supports multiple files)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Filter only image files
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      showToast('Solo se permiten archivos de imagen.', 'error');
      return;
    }
    if (imageFiles.length !== files.length) {
      showToast('Algunos archivos no son imágenes y fueron ignorados.', 'error');
    }

    // Append to existing selection (allows adding more files)
    const newFiles = [...uploadFiles, ...imageFiles];
    setUploadFiles(newFiles);
    setUploadFile(newFiles[0]); // keep first for compatibility

    // Generate preview for each new file
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    // Set uploadPreview to first file for backward compat
    if (uploadFiles.length === 0) {
      const first = imageFiles[0];
      const previewReader = new FileReader();
      previewReader.onloadend = () => setUploadPreview(previewReader.result);
      previewReader.readAsDataURL(first);
      const baseName = first.name.split('.')[0].replace(/[_-]/g, ' ');
      setUploadCaption(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }
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
        // --- Batch Image Upload ---
        if (uploadFiles.length === 0) {
          showToast('Selecciona al menos una imagen primero.', 'error');
          setIsUploading(false);
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < uploadFiles.length; i++) {
          try {
            // Read file as base64
            const file = uploadFiles[i];
            const base64Preview = uploadPreviews[i];
            if (!base64Preview) continue;

            const base64Data = base64Preview.split(',')[1];
            const payload = {
              filename: file.name,
              base64Data,
              hover_caption: uploadCaption,
              categories: uploadCategories
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
            successCount++;

            if (uploadFiles.length > 1) {
              showToast(`Subiendo imagen ${i + 1} de ${uploadFiles.length}...`);
            }
          } catch (fileErr) {
            console.error(`Error uploading file ${uploadFiles[i]?.name}:`, fileErr);
            errorCount++;
          }
        }
        
        // Reset image upload fields
        setUploadFile(null);
        setUploadFiles([]);
        setUploadPreview('');
        setUploadPreviews([]);
        setUploadCaption('');
        setUploadCategories([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        if (errorCount > 0) {
          showToast(`${successCount} imagen(es) subida(s), ${errorCount} error(es).`, 'error');
        } else {
          showToast(`${successCount} imagen(es) subida(s) con éxito.`);
        }

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

  // Save productions list helper (stores normalized objects array)
  const saveProductionsList = async (newList) => {
    const payload = newList.map(p => {
      const folders = p.folders || p.categories || [];
      const images = (p.images || []).map((img, idx) => ({
        src_url: img.src_url || '',
        filename: img.filename || '',
        hover_caption: img.hover_caption || '',
        folder: img.folder || '',
        categories: img.folder ? [img.folder] : [],
        order: typeof img.order === 'number' ? img.order : idx + 1,
        hidden: img.hidden === true
      }));

      return {
        name: p.name,
        description: p.description || '',
        folders: folders,
        categories: folders, // backward compat
        images: images
      };
    });

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
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Error al guardar producciones');
      setProductionsList(payload);
      setNewProdNameInput('');
      showToast('Producciones actualizadas con éxito.');
    } catch (err) {
      console.error(err);
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  // Create new production
  const handleCreateProduction = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const pName = newProdNameInput.trim();
    if (!pName) {
      showToast('Ingresa un nombre para la producción.', 'error');
      return;
    }
    if (productionsList.some(p => p.name.toLowerCase() === pName.toLowerCase())) {
      showToast('Esta producción ya existe.', 'error');
      return;
    }
    
    const newProd = { name: pName, folders: [], categories: [], description: '', images: [] };
    const newList = [...productionsList, newProd];
    await saveProductionsList(newList);
    setSelectedProdName(pName);
    setNewProdNameInput('');
  };

  // Delete production
  const handleDeleteProduction = async (prodName) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la producción "${prodName}" y todas sus fotos?`)) {
      return;
    }
    const newList = productionsList.filter(p => p.name !== prodName);
    await saveProductionsList(newList);
    if (selectedProdName === prodName) {
      setSelectedProdName(newList[0]?.name || '');
    }
    showToast(`Producción "${prodName}" eliminada.`);
  };

  // Rename production
  const handleRenameProduction = async (oldName, newName) => {
    const clean = newName.trim();
    if (!clean || clean === oldName) {
      setEditingProdName(null);
      return;
    }
    if (productionsList.some(p => p.name.toLowerCase() === clean.toLowerCase() && p.name !== oldName)) {
      showToast('Ya existe otra producción con ese nombre.', 'error');
      return;
    }
    const newList = productionsList.map(p => p.name === oldName ? { ...p, name: clean } : p);
    await saveProductionsList(newList);
    if (selectedProdName === oldName) {
      setSelectedProdName(clean);
    }
    setEditingProdName(null);
    showToast(`Producción renombrada a "${clean}".`);
  };

  // Folder management within active production
  const handleAddFolderToActiveProd = async (e) => {
    if (e) e.preventDefault();
    const cleanFolder = newFolderName.trim();
    if (!cleanFolder) return;
    if (!selectedProdName) {
      showToast('Selecciona una producción primero.', 'error');
      return;
    }
    const currentProd = productionsList.find(p => p.name === selectedProdName);
    if (!currentProd) return;
    const currentFolders = currentProd.folders || currentProd.categories || [];
    if (currentFolders.some(f => f.toLowerCase() === cleanFolder.toLowerCase())) {
      showToast('Esta carpeta ya existe en esta producción.', 'error');
      return;
    }
    const updated = [...currentFolders, cleanFolder];
    const newList = productionsList.map(p => p.name === selectedProdName ? { ...p, folders: updated, categories: updated } : p);
    await saveProductionsList(newList);
    setNewFolderName('');
    showToast(`Carpeta "${cleanFolder}" creada en ${selectedProdName}.`);
  };

  const handleDeleteFolderFromActiveProd = async (folderName) => {
    if (!window.confirm(`¿Eliminar la carpeta "${folderName}" de ${selectedProdName}? Las fotos dentro quedarán sin carpeta asignada.`)) return;
    const currentProd = productionsList.find(p => p.name === selectedProdName);
    if (!currentProd) return;
    const currentFolders = currentProd.folders || currentProd.categories || [];
    const updatedFolders = currentFolders.filter(f => f !== folderName);
    const updatedImages = (currentProd.images || []).map(img => ({
      ...img,
      folder: img.folder === folderName ? '' : img.folder,
      categories: (img.categories || []).filter(c => c !== folderName)
    }));
    const newList = productionsList.map(p => p.name === selectedProdName ? { ...p, folders: updatedFolders, categories: updatedFolders, images: updatedImages } : p);
    await saveProductionsList(newList);
    if (selectedProdFolderFilter === folderName) {
      setSelectedProdFolderFilter('All');
    }
    showToast(`Carpeta "${folderName}" eliminada de ${selectedProdName}.`);
  };

  // Handle files selected for production upload
  const handleProdFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      showToast('Solo se permiten archivos de imagen.', 'error');
      return;
    }
    const newFiles = [...prodUploadFiles, ...imageFiles];
    setProdUploadFiles(newFiles);
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdUploadPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    if (prodUploadFiles.length === 0) {
      const first = imageFiles[0];
      const baseName = first.name.split('.')[0].replace(/[_-]/g, ' ');
      setProdUploadCaption(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }
  };

  // Submit batch upload directly to selected production
  const handleProdUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProdName) {
      showToast('Selecciona o crea una producción primero.', 'error');
      return;
    }
    if (prodUploadFiles.length === 0) {
      showToast('Selecciona al menos una imagen.', 'error');
      return;
    }
    if (!isLocal && (!username || !password)) {
      showToast('Credenciales requeridas en producción.', 'error');
      return;
    }

    setIsProdUploading(true);
    let successCount = 0;
    let errorCount = 0;
    const currentProd = productionsList.find(p => p.name === selectedProdName);
    if (!currentProd) {
      setIsProdUploading(false);
      return;
    }

    let existingImages = [...(currentProd.images || [])];

    for (let i = 0; i < prodUploadFiles.length; i++) {
      try {
        const file = prodUploadFiles[i];
        const base64Preview = prodUploadPreviews[i];
        if (!base64Preview) continue;
        const base64Data = base64Preview.split(',')[1];
        
        // raw: true saves image to disk without touching images_canonical.json
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
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Error ${response.status}`);
        }

        const resData = await response.json();
        if (resData.error) throw new Error(resData.error);

        const newImageEntry = {
          filename: resData.data.filename,
          src_url: resData.data.src_url,
          hover_caption: prodUploadCaption || file.name.split('.')[0].replace(/[_-]/g, ' '),
          folder: prodUploadFolder || '',
          categories: prodUploadFolder ? [prodUploadFolder] : [],
          order: existingImages.length + 1,
          hidden: false
        };

        existingImages.push(newImageEntry);
        successCount++;
      } catch (err) {
        console.error(`Error uploading ${prodUploadFiles[i]?.name}:`, err);
        errorCount++;
      }
    }

    const newList = productionsList.map(p => p.name === selectedProdName ? { ...p, images: existingImages } : p);
    await saveProductionsList(newList);

    setProdUploadFiles([]);
    setProdUploadPreviews([]);
    setProdUploadCaption('');
    setProdUploadFolder('');
    if (prodFileInputRef.current) prodFileInputRef.current.value = '';
    setIsProdUploading(false);

    if (errorCount > 0) {
      showToast(`${successCount} subida(s), ${errorCount} error(es).`, 'error');
    } else {
      showToast(`${successCount} imagen(es) subida(s) a "${selectedProdName}".`);
    }
  };

  // Image handlers for active production
  const handleProdImageCaptionChange = (imgIndex, newCaption) => {
    const currentProd = productionsList.find(p => p.name === selectedProdName);
    if (!currentProd) return;
    const images = [...(currentProd.images || [])];
    if (!images[imgIndex]) return;
    images[imgIndex] = { ...images[imgIndex], hover_caption: newCaption };
    const newList = productionsList.map(p => p.name === selectedProdName ? { ...p, images } : p);
    setProductionsList(newList);
  };

  const handleProdImageCaptionBlur = async () => {
    await saveProductionsList(productionsList);
  };

  const handleProdImageFolderChange = async (imgIndex, newFolder) => {
    const currentProd = productionsList.find(p => p.name === selectedProdName);
    if (!currentProd) return;
    const images = [...(currentProd.images || [])];
    if (!images[imgIndex]) return;
    images[imgIndex] = {
      ...images[imgIndex],
      folder: newFolder,
      categories: newFolder ? [newFolder] : []
    };
    const newList = productionsList.map(p => p.name === selectedProdName ? { ...p, images } : p);
    await saveProductionsList(newList);
    showToast(newFolder ? `Foto movida a carpeta "${newFolder}".` : 'Foto sin carpeta asignada.');
  };

  const handleMoveProdImage = async (imgIndex, direction) => {
    const currentProd = productionsList.find(p => p.name === selectedProdName);
    if (!currentProd) return;
    const images = [...(currentProd.images || [])];
    const targetIdx = imgIndex + direction;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    const [moved] = images.splice(imgIndex, 1);
    images.splice(targetIdx, 0, moved);
    const reordered = images.map((img, idx) => ({ ...img, order: idx + 1 }));
    const newList = productionsList.map(p => p.name === selectedProdName ? { ...p, images: reordered } : p);
    await saveProductionsList(newList);
  };

  const handleMoveProdImageExtreme = async (imgIndex, toBottom) => {
    const currentProd = productionsList.find(p => p.name === selectedProdName);
    if (!currentProd) return;
    const images = [...(currentProd.images || [])];
    const targetIdx = toBottom ? images.length - 1 : 0;
    if (imgIndex === targetIdx) return;
    const [moved] = images.splice(imgIndex, 1);
    images.splice(targetIdx, 0, moved);
    const reordered = images.map((img, idx) => ({ ...img, order: idx + 1 }));
    const newList = productionsList.map(p => p.name === selectedProdName ? { ...p, images: reordered } : p);
    await saveProductionsList(newList);
  };

  const handleToggleProdImageVisibility = async (imgIndex) => {
    const currentProd = productionsList.find(p => p.name === selectedProdName);
    if (!currentProd) return;
    const images = [...(currentProd.images || [])];
    if (!images[imgIndex]) return;
    images[imgIndex] = { ...images[imgIndex], hidden: !images[imgIndex].hidden };
    const newList = productionsList.map(p => p.name === selectedProdName ? { ...p, images } : p);
    await saveProductionsList(newList);
  };

  const handleDeleteProdImage = async (imgIndex) => {
    const currentProd = productionsList.find(p => p.name === selectedProdName);
    if (!currentProd) return;
    const item = currentProd.images[imgIndex];
    if (!window.confirm(`¿Eliminar la foto "${item?.hover_caption || item?.filename}" de ${selectedProdName}?`)) return;
    const images = currentProd.images.filter((_, idx) => idx !== imgIndex);
    const reordered = images.map((img, idx) => ({ ...img, order: idx + 1 }));
    const newList = productionsList.map(p => p.name === selectedProdName ? { ...p, images: reordered } : p);
    await saveProductionsList(newList);
    showToast('Foto eliminada de la producción.');
  };

  const activeProd = productionsList.find(p => p.name === selectedProdName) || null;
  const activeProdFolders = activeProd ? (activeProd.folders || activeProd.categories || []) : [];
  const activeProdImages = activeProd ? (activeProd.images || []) : [];

  // Filtered by folder filter + search query
  const filteredProdImages = activeProdImages.filter(item => {
    const matchesSearch = item.hover_caption?.toLowerCase().includes(searchProdQuery.toLowerCase()) || 
                          item.filename?.toLowerCase().includes(searchProdQuery.toLowerCase());
    if (selectedProdFolderFilter === 'All') return matchesSearch;
    return matchesSearch && (item.folder === selectedProdFolderFilter || (item.categories || []).includes(selectedProdFolderFilter));
  });

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
        <h1 className="pf-title text-4xl md:text-6xl font-black text-center mt-4">
          {activeAdminScreen === 'productions' ? 'ADMINISTRADOR DE PRODUCCIONES' : 'ADMINISTRADOR DE GALERÍA'}
        </h1>
        <p className="text-center italic text-neutral-500 mt-2 text-sm md:text-base">
          {activeAdminScreen === 'productions'
            ? 'Crea producciones, especializa sus categorías y administra sus fotos exclusivas en tiempo real.'
            : 'Arrastra imágenes, reordena trabajos y administra las categorías en tiempo real.'}
        </p>

        {/* Dynamic Stats Section */}
        {activeAdminScreen === 'gallery' ? (
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
        ) : (
          <div className="max-w-4xl mx-auto mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
            <div className="bg-[#0b0b0b] border border-neutral-900 p-4 rounded text-center">
              <span className="block text-xs uppercase tracking-widest text-neutral-500 font-['Oswald']">PRODUCCIONES</span>
              <span className="text-2xl font-bold font-['Oswald'] text-white mt-1 block">{productionsList.length}</span>
            </div>
            <div className="bg-[#0b0b0b] border border-neutral-900 p-4 rounded text-center">
              <span className="block text-xs uppercase tracking-widest text-neutral-500 font-['Oswald']">PRODUCCIÓN ACTIVA</span>
              <span className="text-sm font-bold font-['Oswald'] text-red-700 mt-2 block truncate" title={selectedProdName || 'Ninguna'}>
                {selectedProdName || 'Ninguna'}
              </span>
            </div>
            <div className="bg-[#0b0b0b] border border-neutral-900 p-4 rounded text-center">
              <span className="block text-xs uppercase tracking-widest text-neutral-500 font-['Oswald']">FOTOS EN PRODUCCIÓN</span>
              <span className="text-2xl font-bold font-['Oswald'] text-white mt-1 block">{activeProdImages.length}</span>
            </div>
            <div className="bg-[#0b0b0b] border border-neutral-900 p-4 rounded text-center">
              <span className="block text-xs uppercase tracking-widest text-neutral-500 font-['Oswald']">CARPETAS</span>
              <span className="text-2xl font-bold font-['Oswald'] text-red-800 mt-1 block">{activeProdFolders.length}</span>
            </div>
          </div>
        )}

        {/* Screen Switcher Tabs */}
        <div className="max-w-4xl mx-auto mt-8 flex justify-center px-4">
          <div className="bg-[#0b0b0b] border border-neutral-900 rounded-xl p-1.5 flex gap-2 w-full sm:w-auto shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveAdminScreen('gallery')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg font-['Oswald'] text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer ${
                activeAdminScreen === 'gallery'
                  ? 'bg-red-950/80 border border-red-800 text-white shadow-glow'
                  : 'text-neutral-500 hover:text-neutral-200 border border-transparent'
              }`}
            >
              <LayoutGrid size={15} />
              <span>Galería General</span>
              <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-neutral-300 font-mono">
                {gallery.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminScreen('productions')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg font-['Oswald'] text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer ${
                activeAdminScreen === 'productions'
                  ? 'bg-red-950/80 border border-red-800 text-white shadow-glow'
                  : 'text-neutral-500 hover:text-neutral-200 border border-transparent'
              }`}
            >
              <Film size={15} />
              <span>Gestión de Producciones</span>
              <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-neutral-300 font-mono">
                {productionsList.length}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── SCREEN 1: GALERÍA GENERAL ─── */}
      {activeAdminScreen === 'gallery' ? (
        <main className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Upload Panel */}
        <section className="lg:col-span-1">
          <div className="bg-[#090909] border border-neutral-900 p-6 rounded-lg shadow-xl relative overflow-hidden group hover:border-neutral-800 transition-all duration-300">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-950 to-transparent"></div>

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
                /* --- Image Dropzone (supports multiple) --- */
                <div className="space-y-3">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-[#0d0d0d]/40 ${
                      uploadPreviews.length > 0 ? 'border-red-900/60 bg-red-950/5' : 'border-neutral-800 hover:border-red-950 hover:bg-red-950/5'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      multiple
                      className="hidden" 
                    />

                    {uploadPreviews.length > 0 ? (
                      <div className="w-full space-y-3">
                        {/* Thumbnail grid */}
                        <div className={`grid gap-2 w-full ${uploadPreviews.length === 1 ? 'grid-cols-1' : uploadPreviews.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                          {uploadPreviews.map((src, idx) => (
                            <div key={idx} className="relative aspect-square rounded overflow-hidden bg-black flex items-center justify-center group">
                              <img src={src} alt={`Preview ${idx + 1}`} className="max-h-full max-w-full object-cover w-full h-full" />
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUploadFiles(prev => prev.filter((_, i) => i !== idx));
                                  setUploadPreviews(prev => prev.filter((_, i) => i !== idx));
                                  // Update uploadFile/uploadPreview for compatibility
                                  if (idx === 0) {
                                    const remaining = uploadFiles.filter((_, i) => i !== 0);
                                    setUploadFile(remaining[0] || null);
                                    const remainingPreviews = uploadPreviews.filter((_, i) => i !== 0);
                                    setUploadPreview(remainingPreviews[0] || '');
                                  }
                                  if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                className="absolute top-1 right-1 bg-black/80 hover:bg-red-900 border border-neutral-800 p-1 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <X size={12} />
                              </button>
                              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-['Oswald']">
                                {idx + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Summary + add more */}
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-neutral-400 font-['Oswald'] uppercase tracking-wider">
                            {uploadPreviews.length} imagen{uploadPreviews.length > 1 ? 'es' : ''} seleccionada{uploadPreviews.length > 1 ? 's' : ''}
                          </p>
                          <span className="text-xs text-red-700 hover:text-red-500 font-['Oswald'] uppercase tracking-wider">
                            + Agregar más
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Upload size={32} className="mx-auto text-neutral-600 mb-3 group-hover:text-red-800 transition-colors" />
                        <p className="text-sm font-semibold text-neutral-300 uppercase font-['Oswald'] tracking-wider">Seleccionar Imágenes</p>
                        <p className="text-xs text-neutral-500 mt-2">Arrastra tus archivos aquí o haz clic para buscar</p>
                        <p className="text-xs text-red-800/60 mt-1 font-['Oswald'] uppercase tracking-wider">Puedes seleccionar varias a la vez</p>
                      </div>
                    )}
                  </div>
                  {/* Clear all button when files selected */}
                  {uploadPreviews.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadFiles([]);
                        setUploadPreviews([]);
                        setUploadFile(null);
                        setUploadPreview('');
                        setUploadCaption('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="w-full text-xs text-neutral-500 hover:text-red-500 font-['Oswald'] uppercase tracking-wider py-1 transition-colors"
                    >
                      Quitar todas las imágenes
                    </button>
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
      ) : (
        /* ─── SCREEN 2: GESTIÓN DE PRODUCCIONES ─── */
        <main className="max-w-7xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Producciones, Categorías y Subida Directa */}
          <section className="lg:col-span-1 space-y-6">
            {/* 1. Selector y Creación de Producción */}
            <div className="bg-[#090909] border border-neutral-900 p-6 rounded-lg shadow-xl relative overflow-hidden group hover:border-neutral-800 transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-950 to-transparent"></div>
              
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold uppercase tracking-wider text-white font-['Oswald'] flex items-center gap-2">
                  <Film size={18} className="text-red-700" /> Producciones ({productionsList.length})
                </h2>
              </div>
              <p className="text-xs text-neutral-400 italic mb-4">
                Proyectos, películas y series independientes. Cada producción tiene sus propias fotos y categorías.
              </p>

              {/* Producciones list */}
              <div className="space-y-2 mb-6 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {productionsList.length === 0 ? (
                  <div className="p-4 border border-dashed border-neutral-900 rounded text-center text-xs text-neutral-500 italic">
                    No hay producciones creadas aún. Crea la primera abajo.
                  </div>
                ) : (
                  productionsList.map(prod => {
                    const pName = typeof prod === 'string' ? prod : prod.name;
                    const isSelected = selectedProdName === pName;
                    const count = Array.isArray(prod.images) ? prod.images.length : 0;
                    const catCount = Array.isArray(prod.categories) ? prod.categories.length : 0;

                    return (
                      <div
                        key={pName}
                        onClick={() => { setSelectedProdName(pName); setSelectedProdFolderFilter('All'); }}
                        className={`w-full text-left p-3 rounded border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-red-950/40 border-red-800 text-white shadow-glow'
                            : 'bg-[#0d0d0d] border-neutral-900 text-neutral-400 hover:border-neutral-800 hover:text-white'
                        }`}
                      >
                        <div className="flex-1 truncate mr-2">
                          <span className="font-['Oswald'] text-sm uppercase tracking-wide block truncate">
                            {pName}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-sans">
                            {count} foto{count !== 1 ? 's' : ''} • {catCount} carpeta{catCount !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setEditingProdName({ oldName: pName, newName: pName })}
                            title="Renombrar producción"
                            className="p-1 hover:text-white text-neutral-500 transition-colors cursor-pointer"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduction(pName)}
                            title="Eliminar producción"
                            className="p-1 hover:text-red-400 text-neutral-500 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Form to create production */}
              <form onSubmit={handleCreateProduction} className="border-t border-neutral-900 pt-4">
                <label className="block text-[11px] uppercase tracking-widest text-neutral-400 font-['Oswald'] mb-2">
                  Crear Nueva Producción
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newProdNameInput}
                    onChange={(e) => setNewProdNameInput(e.target.value)}
                    placeholder="ej. Bardo, Roma, Mal de Ojo..."
                    className="flex-1 bg-[#0d0d0d] border border-neutral-900 focus:border-red-950 focus:outline-none p-2.5 text-xs text-white rounded font-sans transition-colors"
                  />
                  <button 
                    type="submit"
                    className="px-4 py-2.5 bg-red-950/30 border border-red-800 text-white text-xs font-bold uppercase tracking-wider font-['Oswald'] hover:bg-red-900 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Crear
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Carpetas de la Producción Activa */}
            {selectedProdName && (
              <div className="bg-[#090909] border border-neutral-900 p-6 rounded-lg shadow-xl relative overflow-hidden group hover:border-neutral-800 transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-950 to-transparent"></div>
                
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold uppercase tracking-wider text-white font-['Oswald'] flex items-center gap-2">
                    <Folder size={16} className="text-red-700" /> Carpetas del Proyecto
                  </h2>
                  <span className="text-[10px] bg-red-950/60 border border-red-800/60 text-red-300 px-2 py-0.5 rounded font-['Oswald'] font-bold">
                    {activeProdFolders.length}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 italic mb-4">
                  Crea carpetas para ordenar y estructurar las fotos de <strong className="text-white font-semibold not-italic font-['Oswald']">{selectedProdName}</strong> (ej. Personajes, Escenas, Envejecimiento, Prótesis).
                </p>

                {/* Form to add folder */}
                <form onSubmit={handleAddFolderToActiveProd} className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Nueva carpeta (ej. Personajes)..."
                    className="flex-1 bg-[#0d0d0d] border border-neutral-900 focus:border-red-950 focus:outline-none p-2 text-xs text-white rounded font-sans transition-colors"
                  />
                  <button 
                    type="submit"
                    className="px-3 py-2 bg-red-950/20 border border-red-950 text-white text-xs font-bold uppercase tracking-wider font-['Oswald'] hover:bg-red-900 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <FolderPlus size={13} /> Crear
                  </button>
                </form>

                {/* List of folders */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-['Oswald'] block mb-2">
                    Carpetas de esta producción:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeProdFolders.length === 0 ? (
                      <div className="text-xs text-neutral-600 italic py-2">
                        No hay carpetas en esta producción aún. Crea la primera arriba.
                      </div>
                    ) : (
                      activeProdFolders.map(folder => {
                        const count = activeProdImages.filter(i => i.folder === folder || (i.categories || []).includes(folder)).length;
                        const isFiltered = selectedProdFolderFilter === folder;

                        return (
                          <div 
                            key={folder}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition-colors ${
                              isFiltered
                                ? 'bg-red-900 border-red-700 text-white'
                                : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedProdFolderFilter(isFiltered ? 'All' : folder)}
                              className="font-['Oswald'] uppercase tracking-wider font-semibold text-[11px] text-left cursor-pointer flex items-center gap-1"
                              title={`Filtrar fotos por carpeta "${folder}"`}
                            >
                              <Folder size={11} className={isFiltered ? 'text-white' : 'text-red-600'} />
                              {folder}
                              <span className="ml-0.5 text-[9px] opacity-75 font-mono">({count})</span>
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteFolderFromActiveProd(folder)}
                              title={`Eliminar carpeta ${folder}`}
                              className="text-neutral-500 hover:text-red-400 ml-1 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Subida Directa a esta Producción */}
            {selectedProdName && (
              <div className="bg-[#090909] border border-neutral-900 p-6 rounded-lg shadow-xl relative overflow-hidden group hover:border-neutral-800 transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-950 to-transparent"></div>
                
                <h2 className="text-lg font-bold uppercase tracking-wider text-white mb-2 font-['Oswald'] flex items-center gap-2">
                  <Upload size={16} className="text-red-700" /> Subir Fotos a esta Producción
                </h2>
                <p className="text-xs text-neutral-400 italic mb-5">
                  Las fotos seleccionadas se guardarán exclusivamente dentro de <strong className="text-white font-semibold not-italic font-['Oswald']">{selectedProdName}</strong>.
                </p>

                <form onSubmit={handleProdUploadSubmit} className="space-y-5">
                  {/* Dropzone */}
                  <div 
                    onClick={() => prodFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-[#0d0d0d]/40 ${
                      prodUploadPreviews.length > 0 ? 'border-red-900/60 bg-red-950/5' : 'border-neutral-800 hover:border-red-950 hover:bg-red-950/5'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={prodFileInputRef}
                      onChange={handleProdFileChange}
                      accept="image/*"
                      multiple
                      className="hidden" 
                    />

                    {prodUploadPreviews.length > 0 ? (
                      <div className="w-full space-y-3">
                        <div className={`grid gap-2 w-full ${prodUploadPreviews.length === 1 ? 'grid-cols-1' : prodUploadPreviews.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                          {prodUploadPreviews.map((src, idx) => (
                            <div key={idx} className="relative aspect-square rounded overflow-hidden bg-black flex items-center justify-center group/p">
                              <img src={src} alt={`Preview ${idx + 1}`} className="max-h-full max-w-full object-cover w-full h-full" />
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProdUploadFiles(prev => prev.filter((_, i) => i !== idx));
                                  setProdUploadPreviews(prev => prev.filter((_, i) => i !== idx));
                                  if (prodFileInputRef.current) prodFileInputRef.current.value = '';
                                }}
                                className="absolute top-1 right-1 bg-black/80 hover:bg-red-900 border border-neutral-800 p-1 rounded-full text-white transition-colors opacity-0 group-hover/p:opacity-100"
                              >
                                <X size={12} />
                              </button>
                              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-['Oswald']">
                                {idx + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-neutral-400 font-['Oswald'] uppercase tracking-wider">
                            {prodUploadPreviews.length} seleccionada{prodUploadPreviews.length > 1 ? 's' : ''}
                          </p>
                          <span className="text-xs text-red-700 hover:text-red-500 font-['Oswald'] uppercase tracking-wider">
                            + Agregar más
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Upload size={28} className="mx-auto text-neutral-600 mb-2 group-hover:text-red-800 transition-colors" />
                        <p className="text-xs font-semibold text-neutral-300 uppercase font-['Oswald'] tracking-wider">Seleccionar Imágenes</p>
                        <p className="text-[11px] text-neutral-500 mt-1">Puedes elegir varias fotos a la vez</p>
                      </div>
                    )}
                  </div>

                  {prodUploadPreviews.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setProdUploadFiles([]);
                        setProdUploadPreviews([]);
                        setProdUploadCaption('');
                        if (prodFileInputRef.current) prodFileInputRef.current.value = '';
                      }}
                      className="w-full text-xs text-neutral-500 hover:text-red-500 font-['Oswald'] uppercase tracking-wider py-0.5 transition-colors cursor-pointer"
                    >
                      Quitar todas las imágenes seleccionadas
                    </button>
                  )}

                  {/* Caption */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest text-neutral-400 font-['Oswald'] mb-1.5">
                      Leyenda / Título
                    </label>
                    <input 
                      type="text" 
                      value={prodUploadCaption}
                      onChange={(e) => setProdUploadCaption(e.target.value)}
                      placeholder="ej. Caracterización prótesis personaje..."
                      className="w-full bg-[#0d0d0d] border border-neutral-900 hover:border-neutral-800 focus:border-red-950 focus:outline-none p-2.5 text-xs text-white rounded font-sans transition-colors"
                    />
                  </div>

                  {/* Carpeta selector for upload */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-widest text-neutral-400 font-['Oswald'] mb-1.5 flex items-center gap-1.5">
                      <Folder size={12} className="text-red-600" /> Guardar en Carpeta de {selectedProdName}:
                    </label>
                    <select
                      value={prodUploadFolder}
                      onChange={(e) => setProdUploadFolder(e.target.value)}
                      className="w-full bg-[#0d0d0d] border border-neutral-900 hover:border-neutral-800 focus:border-red-950 focus:outline-none p-2.5 text-xs text-white rounded font-sans transition-colors cursor-pointer"
                    >
                      <option value="">Sin Carpeta (General)</option>
                      {activeProdFolders.map(folder => (
                        <option key={folder} value={folder}>📁 {folder}</option>
                      ))}
                    </select>
                    {activeProdFolders.length === 0 && (
                      <p className="text-[10px] text-neutral-500 italic mt-1">
                        Puedes crear carpetas en el bloque superior para organizar las fotos de esta producción.
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isProdUploading || prodUploadFiles.length === 0}
                    className={`w-full py-3 px-4 border rounded font-['Oswald'] text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                      isProdUploading || prodUploadFiles.length === 0
                        ? 'border-neutral-900 bg-neutral-900/20 text-neutral-600 cursor-not-allowed'
                        : 'border-red-800 bg-red-950/40 text-white hover:bg-red-900 cursor-pointer shadow-lg hover:shadow-red-900/20'
                    }`}
                  >
                    {isProdUploading ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-white" /> SUBIENDO A PRODUCCIÓN...
                      </>
                    ) : (
                      <>
                        <Upload size={14} /> SUBIR {prodUploadFiles.length > 0 ? `(${prodUploadFiles.length}) ` : ''}FOTO{prodUploadFiles.length !== 1 ? 'S' : ''} A "{selectedProdName.toUpperCase()}"
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </section>

          {/* Right Column: Gestión de Fotos de la Producción */}
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-[#090909] border border-neutral-900 p-6 rounded-lg shadow-xl relative">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-950 to-transparent"></div>

              {/* Header of Active Production */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-6 mb-6">
                <div>
                  <span className="text-[10px] font-['Oswald'] uppercase tracking-[0.25em] text-red-700 font-bold block mb-1">
                    Producción Activa
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wide text-white font-['Oswald']">
                    {selectedProdName || 'Selecciona una producción'}
                  </h2>
                  <p className="text-xs text-neutral-500 font-sans mt-1">
                    {activeProdImages.length} foto{activeProdImages.length !== 1 ? 's' : ''} exclusiva{activeProdImages.length !== 1 ? 's' : ''} de esta producción
                    {activeProdFolders.length > 0 && ` • ${activeProdFolders.length} carpeta(s)`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search within this production */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" />
                    <input 
                      type="text"
                      value={searchProdQuery}
                      onChange={(e) => setSearchProdQuery(e.target.value)}
                      placeholder="Buscar en esta producción..."
                      className="bg-[#0d0d0d] border border-neutral-900 hover:border-neutral-800 focus:border-red-950 focus:outline-none pl-9 pr-4 py-2 text-xs text-white rounded font-sans w-full sm:w-56 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Folder Filters for this production */}
              {selectedProdName && (
                <div className="flex items-center gap-2 flex-wrap pb-4 mb-4 border-b border-neutral-900/60">
                  <span className="text-[10px] uppercase font-['Oswald'] text-neutral-500 tracking-widest mr-1 flex items-center gap-1">
                    <Folder size={12} className="text-red-700" /> Carpetas:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedProdFolderFilter('All')}
                    className={`text-[10px] font-['Oswald'] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors cursor-pointer ${
                      selectedProdFolderFilter === 'All'
                        ? 'bg-red-950 border border-red-800 text-white'
                        : 'text-neutral-500 hover:text-white border border-neutral-900 bg-[#0d0d0d]'
                    }`}
                  >
                    TODAS LAS FOTOS ({activeProdImages.length})
                  </button>
                  {activeProdFolders.map(folder => {
                    const count = activeProdImages.filter(i => i.folder === folder || (i.categories || []).includes(folder)).length;
                    return (
                      <button
                        key={folder}
                        type="button"
                        onClick={() => setSelectedProdFolderFilter(folder)}
                        className={`text-[10px] font-['Oswald'] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                          selectedProdFolderFilter === folder
                            ? 'bg-red-950 border border-red-800 text-white'
                            : 'text-neutral-400 hover:text-white border border-neutral-900 bg-[#0d0d0d]'
                        }`}
                      >
                        <Folder size={11} className={selectedProdFolderFilter === folder ? 'text-white' : 'text-red-600'} />
                        {folder.toUpperCase()} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              {/* List Header */}
              <div className="text-xs uppercase tracking-widest text-neutral-500 font-['Oswald'] flex items-center px-4 py-2 border-b border-neutral-900 bg-neutral-950/20 mb-2">
                <div className="w-12 text-center">Orden</div>
                <div className="w-16 ml-4">Miniatura</div>
                <div className="flex-grow ml-6">Título y Carpeta</div>
                <div className="w-48 text-right">Acciones</div>
              </div>

              {/* Strictly Vertical Photos List */}
              <div className="flex flex-col space-y-3 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar w-full">
                {filteredProdImages.length === 0 ? (
                  <div className="py-16 text-center text-neutral-500 italic space-y-3">
                    <FolderOpen size={40} className="mx-auto text-neutral-700 opacity-60" />
                    <p className="text-sm">
                      {!selectedProdName 
                        ? 'Selecciona una producción en la columna izquierda.' 
                        : activeProdImages.length === 0 
                          ? 'Esta producción aún no tiene fotos. Sube imágenes desde el panel izquierdo para comenzar.' 
                          : `No hay fotos en la carpeta "${selectedProdFolderFilter}".`}
                    </p>
                  </div>
                ) : (
                  filteredProdImages.map((item, idx) => {
                    const realIndex = activeProdImages.findIndex(i => i.filename === item.filename);

                    return (
                      <article
                        key={`${item.filename}-${idx}`}
                        className={`w-full bg-[#0b0b0b] hover:bg-[#0e0e0e] border border-neutral-900 hover:border-neutral-800 p-4 rounded flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 ${
                          item.hidden ? 'opacity-40 border-dashed border-red-950/40 bg-black/40' : ''
                        }`}
                      >
                        {/* Order Display */}
                        <div className="flex items-center gap-1 w-full md:w-auto">
                          <span className="text-xs font-['Oswald'] text-neutral-500 uppercase mr-2 md:hidden">Orden:</span>
                          <span className="w-10 bg-black border border-neutral-900 text-center py-1.5 text-xs text-white rounded font-sans font-bold">
                            {idx + 1}
                          </span>
                        </div>

                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded overflow-hidden bg-black flex-shrink-0 border border-neutral-900 relative group/thumb">
                          <img 
                            src={item.src_url} 
                            alt={item.hover_caption || 'Producción'} 
                            className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-500" 
                            onError={(e) => {
                              e.target.src = `/imagenes web/imagenes/${item.filename}`;
                            }}
                          />
                        </div>

                        {/* Details & Folder selector */}
                        <div className="flex-grow space-y-2 w-full md:w-auto">
                          <input 
                            type="text"
                            value={item.hover_caption || ''}
                            onChange={(e) => handleProdImageCaptionChange(realIndex, e.target.value)}
                            onBlur={handleProdImageCaptionBlur}
                            className="w-full bg-transparent border-b border-transparent hover:border-neutral-800 focus:border-red-950 focus:outline-none pb-0.5 text-sm font-semibold text-white tracking-wide font-sans transition-colors"
                            placeholder="Título de la imagen..."
                          />

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-neutral-600 font-mono select-all truncate block max-w-xs">{item.filename}</span>
                            {item.hidden && (
                              <span className="text-[8px] bg-red-950/60 border border-red-900/60 text-red-400 px-1.5 py-0.5 rounded font-['Oswald'] uppercase tracking-wider font-bold leading-none">
                                Oculto en Web
                              </span>
                            )}
                          </div>

                          {/* Folder assignment */}
                          <div className="flex items-center gap-2 pt-1">
                            <Folder size={12} className="text-red-700" />
                            <span className="text-[10px] font-['Oswald'] uppercase tracking-wider text-neutral-500">
                              Carpeta:
                            </span>
                            <select
                              value={item.folder || ''}
                              onChange={(e) => handleProdImageFolderChange(realIndex, e.target.value)}
                              className="bg-[#121212] border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-red-900 font-sans cursor-pointer"
                            >
                              <option value="">Sin carpeta (General)</option>
                              {activeProdFolders.map(folder => (
                                <option key={folder} value={folder}>📁 {folder}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Actions & Ordering */}
                        <div className="flex items-center gap-1 self-end md:self-center">
                          {/* Reorder buttons */}
                          <button 
                            onClick={() => handleMoveProdImageExtreme(realIndex, false)}
                            disabled={realIndex === 0}
                            title="Enviar al Inicio"
                            className="p-1.5 rounded bg-[#0d0d0d] hover:bg-[#1a1a1a] text-neutral-500 hover:text-white border border-neutral-900 disabled:opacity-20 cursor-pointer transition-colors"
                          >
                            <ChevronsUp size={14} />
                          </button>
                          <button 
                            onClick={() => handleMoveProdImage(realIndex, -1)}
                            disabled={realIndex === 0}
                            title="Subir un lugar"
                            className="p-1.5 rounded bg-[#0d0d0d] hover:bg-[#1a1a1a] text-neutral-500 hover:text-white border border-neutral-900 disabled:opacity-20 cursor-pointer transition-colors"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button 
                            onClick={() => handleMoveProdImage(realIndex, 1)}
                            disabled={realIndex === activeProdImages.length - 1}
                            title="Bajar un lugar"
                            className="p-1.5 rounded bg-[#0d0d0d] hover:bg-[#1a1a1a] text-neutral-500 hover:text-white border border-neutral-900 disabled:opacity-20 cursor-pointer transition-colors"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button 
                            onClick={() => handleMoveProdImageExtreme(realIndex, true)}
                            disabled={realIndex === activeProdImages.length - 1}
                            title="Enviar al Final"
                            className="p-1.5 rounded bg-[#0d0d0d] hover:bg-[#1a1a1a] text-neutral-500 hover:text-white border border-neutral-900 disabled:opacity-20 cursor-pointer transition-colors"
                          >
                            <ChevronsDown size={14} />
                          </button>

                          {/* Visibility */}
                          <button 
                            onClick={() => handleToggleProdImageVisibility(realIndex)}
                            title={item.hidden ? "Mostrar en la web" : "Ocultar en la web"}
                            className={`p-1.5 rounded border border-neutral-900 transition-colors ml-1 cursor-pointer ${
                              item.hidden 
                                ? 'bg-red-950/20 text-red-500 hover:bg-red-900/30' 
                                : 'bg-[#0d0d0d] text-neutral-500 hover:bg-neutral-800 hover:text-white'
                            }`}
                          >
                            {item.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>

                          {/* Delete permanently from this production */}
                          <button 
                            onClick={() => handleDeleteProdImage(realIndex)}
                            title="Eliminar foto de esta producción"
                            className="p-1.5 rounded border border-neutral-900 bg-[#0d0d0d] text-neutral-500 hover:bg-red-950 hover:text-red-400 hover:border-red-900 transition-colors ml-1 cursor-pointer"
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
      )}

      {/* Modal to rename production */}
      {editingProdName && (
        <div className="fixed inset-0 z-[1200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-[#0a0a0a] border border-neutral-800 rounded-xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold uppercase font-['Oswald'] text-white mb-2">
              Renombrar Producción
            </h3>
            <p className="text-xs text-neutral-400 italic mb-4">
              Cambiar el nombre actualizará automáticamente todas las fotos asignadas a esta producción.
            </p>
            <input 
              type="text" 
              value={editingProdName.newName}
              onChange={(e) => setEditingProdName(prev => ({ ...prev, newName: e.target.value }))}
              className="w-full bg-[#0d0d0d] border border-neutral-800 focus:border-red-950 focus:outline-none p-3 text-sm text-white rounded font-sans mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProdName(null)}
                className="px-4 py-2 border border-neutral-800 hover:bg-neutral-900 text-neutral-400 text-xs font-bold uppercase tracking-wider font-['Oswald'] rounded transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleRenameProduction(editingProdName.oldName, editingProdName.newName)}
                className="px-5 py-2 bg-red-950/60 border border-red-800 hover:bg-red-900 text-white text-xs font-bold uppercase tracking-wider font-['Oswald'] rounded transition-colors cursor-pointer"
              >
                Guardar Nombre
              </button>
            </div>
          </div>
        </div>
      )}

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
