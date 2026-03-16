import {
  Home,
  GraduationCap,
  Calendar,
  Users,
  FileText,
  Award,
  Settings,
  Bell,
  BarChart3,
  BookOpen,
  UserPlus,
  UsersRound,
  ChevronDown,
  DollarSign,
  Trophy,
  Briefcase,
  FileCheck,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';

export const AppSidebar = () => {
  const { user } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();

  const facultyLinks = [
    { title: 'Dashboard', url: '/faculty', icon: Home },
    {
      title: 'My FDP',
      icon: Award,
      subItems: [
        { title: 'Attended FDPs', url: '/faculty/fdp/attended', icon: Award },
        { title: 'Organized FDPs', url: '/faculty/fdp/organized', icon: Award },
      ]
    },
    {
      title: 'Teaching & Learning',
      icon: BookOpen,
      subItems: [
        { title: 'ABL Reports', url: '/faculty/abl', icon: FileText },
        { title: 'Adjunct Faculty', url: '/faculty/adjunct', icon: UserPlus },
        { title: 'Joint Teaching', url: '/faculty/joint-teaching', icon: UsersRound },
      ]
    },
    { title: 'Seminars', url: '/faculty/seminars', icon: GraduationCap },
    { title: 'Reimbursements', url: '/faculty/reimbursements', icon: DollarSign },
    { title: 'Achievements', url: '/faculty/achievements', icon: Trophy },
    { title: 'Internships', url: '/faculty/internships', icon: Briefcase },
    { title: 'Upcoming Events', url: '/faculty/events', icon: Calendar },
    { title: 'Notifications', url: '/faculty/notifications', icon: Bell },
  ];

  const adminLinks = [
    { title: 'Dashboard', url: '/admin', icon: Home },
    { title: 'Faculty Profiles', url: '/admin/faculty', icon: Users },
    {
      title: 'FDP Records',
      icon: Award,
      subItems: [
        { title: 'FDP Attended', url: '/admin/fdp/attended', icon: Award },
        { title: 'FDP Organized', url: '/admin/fdp/organized', icon: Award },
      ]
    },
    { title: 'Seminars', url: '/admin/seminars', icon: GraduationCap },
    {
      title: 'Teaching Records',
      icon: BookOpen,
      subItems: [
        { title: 'ABL Reports', url: '/admin/abl', icon: FileText },
        { title: 'Adjunct Faculty', url: '/admin/adjunct', icon: UserPlus },
        { title: 'Joint Teaching', url: '/admin/joint-teaching', icon: UsersRound },
      ]
    },
    { title: 'Reimbursements', url: '/admin/reimbursements', icon: DollarSign },
    { title: 'Achievements', url: '/admin/achievements', icon: Trophy },
    { title: 'Internships', url: '/admin/internships', icon: Briefcase },
    { title: 'Audit & Reports', url: '/admin/audit', icon: FileCheck },
    { title: 'Notifications', url: '/admin/notifications', icon: Bell },
    { title: 'Control', url: '/admin/control', icon: UsersRound },
    { title: 'Settings', url: '/admin/settings', icon: Settings },
  ];

  const hodLinks = [
    { title: 'Dashboard', url: '/hod', icon: Home },
    { title: 'Faculty Overview', url: '/hod/faculty', icon: Users },
    { title: 'Analytics', url: '/hod/analytics', icon: BarChart3 },
    { title: 'Records', url: '/hod/records', icon: FileText },
    { title: 'Audit & Reports', url: '/hod/audit', icon: FileCheck },
    { title: 'Notifications', url: '/hod/notifications', icon: Bell },
  ];

  const getLinks = () => {
    switch (user?.role) {
      case 'admin':
        return adminLinks;
      case 'hod':
        return hodLinks;
      case 'faculty':
        return facultyLinks;
      default:
        return [];
    }
  };

  const links = getLinks();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((item) => {
                if ('subItems' in item) {
                  const shouldOpen = item.title === 'Teaching & Learning' ||
                    (location.pathname.startsWith('/faculty') &&
                      item.subItems.some(subItem => location.pathname === subItem.url));
                  return (
                    <Collapsible key={item.title} defaultOpen={shouldOpen} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span>{item.title}</span>}
                            {!isCollapsed && <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={location.pathname === subItem.url}>
                                  <NavLink to={subItem.url}>
                                    <subItem.icon className="h-4 w-4" />
                                    {!isCollapsed && <span>{subItem.title}</span>}
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
