'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu as ProfileMenu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Dashboard,
  ShoppingCart,
  Inventory2,
  Storefront,
  TrendingUp,
  AccountBalance,
  Notifications,
  Hub,
  LogoutOutlined,
  Menu as MenuIcon,
  PersonOutline,
  Settings,
  Warning,
} from '@mui/icons-material';
const items = [
  ['Dashboard', '/', Dashboard],
  ['Vendas', '/sales', ShoppingCart],
  ['Produtos', '/products', Inventory2],
  ['Anúncios', '/listings', Storefront],
  ['Rentabilidade', '/profitability', TrendingUp],
  ['DRE', '/dre', AccountBalance],
  ['Alertas', '/alerts', Warning],
  ['Integrações', '/integrations', Hub],
  ['Configurações', '/settings', Settings],
];
function Nav() {
  return (
    <List>
      {items.map(([label, href, Icon]: any) => (
        <ListItemButton component={Link} href={href} key={label}>
          <ListItemIcon>
            <Icon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={label} />
        </ListItemButton>
      ))}
    </List>
  );
}
export default function Shell({ children }: { children: React.ReactNode }) {
  const [w, setW] = useState(false),
    [ready, setReady] = useState(false),
    [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null),
    router = useRouter();
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);
  const logout = () => {
    localStorage.removeItem('token');
    router.replace('/login');
  };
  const closeProfile = () => setProfileAnchor(null);
  if (!ready) return null;
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider', zIndex: 1300 }}
      >
        <Toolbar>
          <IconButton sx={{ display: { md: 'none' } }} onClick={() => setW(true)}>
            <MenuIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 800, color: 'primary.main', fontSize: 20 }}>
            seller pulse
          </Typography>
          <Box sx={{ flex: 1 }} />
          <IconButton>
            <Notifications />
          </IconButton>
          <Tooltip title="Perfil e conta">
            <IconButton
              aria-label="Abrir menu de perfil"
              onClick={(event) => setProfileAnchor(event.currentTarget)}
              sx={{ ml: 0.5, p: 0.5 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>DS</Avatar>
            </IconButton>
          </Tooltip>
          <ProfileMenu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={closeProfile}
            slotProps={{ paper: { elevation: 3, sx: { mt: 1, minWidth: 220, borderRadius: 2 } } }}
          >
            <Box sx={{ px: 2, py: 1.25 }}>
              <Typography fontWeight={700} variant="body2">
                Demo Seller
              </Typography>
              <Typography className="muted" variant="caption">
                Minha conta
              </Typography>
            </Box>
            <Divider />
            <MenuItem component={Link} href="/settings" onClick={closeProfile}>
              <ListItemIcon>
                <PersonOutline fontSize="small" />
              </ListItemIcon>
              Configurações da conta
            </MenuItem>
            <MenuItem onClick={logout} sx={{ color: 'error.main' }}>
              <ListItemIcon sx={{ color: 'error.main' }}>
                <LogoutOutlined fontSize="small" />
              </ListItemIcon>
              Sair
            </MenuItem>
          </ProfileMenu>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: 245, top: 64, borderRight: 1, borderColor: 'divider' },
        }}
      >
        <Nav />
      </Drawer>
      <Drawer open={w} onClose={() => setW(false)} sx={{ display: { md: 'none' } }}>
        <Box sx={{ width: 260, pt: 2 }}>
          <Nav />
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{ flexGrow: 1, pt: 8, ml: { md: '245px' }, width: { md: 'calc(100% - 245px)' } }}
      >
        {children}
      </Box>
    </Box>
  );
}
