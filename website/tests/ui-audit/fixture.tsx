// @ts-nocheck — browser-only fixture with intentionally mocked backend contracts.
import React, { useEffect, useState } from 'react';
import {createRoot} from 'react-dom/client';
import {Modal} from '@/components/ui/Modal';
import {Drawer} from '@/components/ui/Drawer';
import ContactForm from '@/app/contact/ContactForm';
import WithdrawForm from '@/app/account/wallet/WithdrawForm';
import NotificationRow from '@/app/account/notifications/NotificationRow';
import {RemoveSavedButton} from '@/app/account/saved-projects/RemoveSavedButton';
import {useSessionProfile} from '@/lib/useSessionProfile';
import {useLearningBookmarks} from '@/lib/useLearningBookmarks';
import {emitSessionChange} from '@/lib/sessionSignal';
import {GlobalSearchField} from '@/components/search/GlobalSearch';
import {MockTestRunner} from '@/app/mock-tests/[testId]/MockTestRunner';
import {useDraft} from '@/app/custom-projects/_builder/useDraft';
import {useAutosaveField} from "@/app/account/resume/[id]/edit/useAutosaveField";
import ShareModal from '@/components/resumeBuilder/ShareModal';
import LessonPage from '@/app/learning/[gridSlug]/[topicSlug]/page';
import { Header } from '@/components/nav/Header';
import { BottomNav } from '@/components/nav/BottomNav';
import { SearchBar } from '@/components/ui/SearchBar';
import { ReadingProgress } from '@/app/learning/_components/ReadingProgress';
import { HomeHero } from '@/components/home/HomeHero';
import LearningIndexPage from '@/app/learning/page';
import CourseDetailPage from '@/app/learning/[gridSlug]/page';
import { getLearningGrids } from '@/lib/learning';
import { FilterSheet } from '@/components/ui/FilterSheet';
import { ProjectFilters } from '@/components/marketplace/ProjectFilters';
(window as any).emitSessionChange=emitSessionChange;
function Session(){const {profile}=useSessionProfile();return <output id="profile">{profile?.id ?? 'anon'}</output>}
function Bookmarks(){const ids=useLearningBookmarks();return <output id="bookmarks">{[...ids].join(',')}</output>}
// Exercise the real lesson route's JSX and client islands with mocked data access.
function LessonFixture() {
 const [content,setContent]=useState<React.ReactNode>(null);
 useEffect(()=>{let live=true;LessonPage({params:{gridSlug:'java',topicSlug:'loops'}}).then(node=>{if(live)setContent(node)});return()=>{live=false}},[]);
 return <><Header/><main id="main-content">{content}</main><div className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden/><BottomNav/></>;
}
function SharedUiFixture() {
 return <><Header/><ReadingProgress targetId="shared-reading-target"/><main id="main-content" className="mobile-scroll-content container-page py-4"><SearchBar action="/search" placeholder="Search courses, projects, jobs…" hiddenParams={{type:'learning'}}/><div className="mt-4"><GlobalSearchField variant="page"/></div><article id="shared-reading-target" className="mt-6"><h1 className="h-section">Shared UI fixture</h1>{Array.from({length:24},(_,i)=><p key={i} className="my-4 leading-7">Reading fixture paragraph {i+1} for scroll progress and fixed navigation clearance.</p>)}</article><button id="shared-last-control" className="btn-ghost">Last control</button></main><div className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden/><BottomNav/></>;
}
function DiscoveryFixture({home}:{home:boolean}) {
 const [content,setContent]=useState<React.ReactNode>(null);
 useEffect(()=>{let live=true;(home?getLearningGrids().then(courses=><HomeHero courses={courses} stats={[{value:courses.length,label:'courses'},{value:courses.reduce((n,c)=>n+c.topic_count,0),label:'lessons'}]}/>):LearningIndexPage({searchParams:{}})).then(node=>{if(live)setContent(node)});return()=>{live=false}},[home]);
 return <><Header/><main id="main-content">{content}</main><div className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden/><BottomNav/></>;
}
function CourseFixture() {
 const [content,setContent]=useState<React.ReactNode>(null);
 useEffect(()=>{let live=true;CourseDetailPage({params:{gridSlug:'java'}}).then(node=>{if(live)setContent(node)});return()=>{live=false}},[]);
 return <><Header/><main id="main-content">{content}</main><div className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden/><BottomNav/></>;
}
function Draft(){const d=useDraft();const [status,setStatus]=useState('');return <><output id="draft">{d.loaded?'ready':'loading'}</output><button onClick={async()=>{d.patch({title:'Latest draft'});try{await d.saveNow();setStatus('saved')}catch{setStatus('failed')}}}>Save latest</button><button onClick={()=>d.patch({title:'Pending draft'})}>Edit draft</button><button onClick={async()=>{await d.clearDraft();setStatus('cleared')}}>Clear draft</button><output id="save-status">{status}</output></>}
function Autosave(){const [value,setValue]=useState('initial');const [status,setStatus]=useState('idle');useAutosaveField(value,(v)=>{window.savedValues=(window.savedValues||[]).concat(v);return new Promise(resolve=>{window.finishSave=()=>resolve({ok:true})})},setStatus,20);return <><button onClick={()=>setValue('one')}>First edit</button><button onClick={()=>setValue('two')}>Second edit</button><output id="autosave-status">{status}</output></>}
function App(){const [open,setOpen]=useState(false);const [nested,setNested]=useState(false);const [long,setLong]=useState(false);const [value,setValue]=useState('');const kind=location.hash.slice(1);
 if(kind.startsWith('lesson'))return <LessonFixture/>;
 if(kind==='shared')return <SharedUiFixture/>;
 if(kind==='project-filters')return <main><FilterSheet><ProjectFilters categories={[{id:'web',name:'Web'}]} state={{min:'100',max:'2000'}}/></FilterSheet></main>;
 if(kind.startsWith('discovery'))return <DiscoveryFixture home={kind==='discovery-home'}/>;
 if(kind==='course')return <CourseFixture/>;
 if(kind==='autosave')return <Autosave/>;
 if(kind==='draft')return <Draft/>;
 if(kind==='contact')return <ContactForm/>;
 if(kind==='withdraw')return <WithdrawForm balance={100} minPayout={0.01} hasPending={false}/>;
 if(kind==='notification')return <NotificationRow notification={{id:'n',title:'Notice',body:'Body',category:'test',is_read:false,created_at:'2026-10-26T00:00:00Z'}}/>;
 if(kind==='remove')return <RemoveSavedButton projectId="p"/>;
 if(kind==='session')return <Session/>;
 if(kind==='bookmarks')return <Bookmarks/>;
 if(kind==='search')return <><button onClick={()=>setValue('updated')}>Update query</button><GlobalSearchField variant="page" defaultValue={value}/></>;
 if(kind==='quiz')return <MockTestRunner testId="test" title="Test" durationMinutes={1} isPremium={false} resultBase="/mock-tests/test"/>;
 if(kind==='share')return <ShareModal resumeId="r" initialShares={[{id:'s',token:'token',isActive:true,viewCount:0,createdAt:''}] as any}/>;
 return <><button id="opener" onClick={()=>setOpen(true)}>Open</button><button id="background">Background</button><Modal open={open} onClose={()=>setOpen(false)} title="Dialog"><input aria-label="Dialog input"/><button onClick={()=>setLong(!long)}>Long content</button><button onClick={()=>setNested(true)}>Nested</button>{long&&<div style={{height:1600}}>Long body</div>}<button>Last</button><Drawer open={nested} onClose={()=>setNested(false)} title="Nested"><button>Drawer last</button></Drawer></Modal></>
}
createRoot(document.getElementById('root')!).render(<App/>);
