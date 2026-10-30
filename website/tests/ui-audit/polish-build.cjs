// Run from the repository root. Uses existing esbuild/Tailwind, never production data.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const root = process.cwd(), web = root + '/website', out = '/tmp/campusedux-polish';
const esbuild = require(web + '/node_modules/esbuild');
fs.mkdirSync(out, { recursive: true });
const data = `
const q=new URLSearchParams(location.search), state=q.get('state'), count=state==='empty'?0:state==='many'?105:3;
const long=state==='long'||state==='many';
const title=long?'शिकण्याची नवी सुरुवात • नई तकनीक सीखें '+ 'VeryLongUnbrokenTitleForLayoutVerification'.repeat(5):'Practical programming';
export const user=q.get('auth')==='out'?null:{id:'fixture-user',fullName:long?'विद्यार्थी'.repeat(30):'Test Student',email:'student@example.test',avatarUrl:null,isPremium:false};
export const courses=Array.from({length:count},(_,i)=>({id:'course-'+i,slug:'course-'+i,name:title+' '+i,description:long?title.repeat(2):'Build confidence with guided examples and short practical lessons.',icon:null,icon_url:null,cover_image_url:null,accent_color:null,is_featured:i<2,is_premium:i===1,sort_order:i,section_count:2,topic_count:5,grid_type:'content'}));
export const jobs=Array.from({length:count},(_,i)=>({id:'job-'+i,title:title+' '+i,company_name:long?title:'Campus team',location:long?title:'Remote · India',job_type:'Full Time',salary_range:'₹6–9 LPA',posted_at:new Date().toISOString(),experience_level:'Fresher'}));
export const projects=Array.from({length:count},(_,i)=>({id:'project-'+i,title:title+' '+i,category_name:long?title:'Web development',tech_stack:long?[title,title+'2','React']:['React','TypeScript','SQL'],price:i?1499:0,original_price:i?1999:null,rating:4.5,review_count:12,thumbnail_url:null,is_premium:i===1,is_best_seller:i===1}));
export const categories=[{id:'web',name:'Web development'},{id:'ai',name:long?title:'AI & ML'}];`;
const mocks = {
  'polish-data': data,
  'next/link': `import React from 'react';export default function Link({href,children,...p}){return <a href={href} {...p}>{children}</a>}`,
  'next/image': `import React from 'react';export default function Image({fill,priority,placeholder,blurDataURL,...p}){return <img {...p} style={fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:p.style}/>}`,
  'next/navigation': `export function usePathname(){const p=new URLSearchParams(location.search).get('page');return !p||p==='home'?'/':'/'+p}export function useRouter(){return {push:()=>{},refresh:()=>{}}}export function redirect(href){throw new Error('REDIRECT:'+href)}`,
  'next/dynamic': `export default ()=>()=>null`,
  '@/lib/learning': `import {courses} from 'polish-data';export async function getLearningGrids(){return courses}export async function searchLearning(){return []}export async function getLearningTree(){return null}`,
  '@/lib/cache': `import {jobs,projects,categories} from 'polish-data';export async function getCachedJobsPage(){return {jobs,count:jobs.length}}export async function getCachedProjectsPage(){return {projects,count:projects.length}}export async function getCachedCategories(){return categories}export async function getCachedHomeData(){return {trending:projects.slice(0,3),jobs:jobs.slice(0,3),testimonials:[],faqs:[],banners:[]}}`,
  '@/lib/blog': `export async function getLatestPosts(){return []}export function formatBlogDate(){return "28 Oct 2026"}`,
  '@/lib/practice': `export async function getPracticeCategories(){return []}`,
  '@/lib/interviewQuestions': `export async function getInterviewCategories(){return []}`,
  '@/lib/referral': `export async function getRewardSettings(){return {}}export function referralRewardText(){return 'Invite friends to CampusEduX'}`,
  '@/lib/auth': `import {user} from 'polish-data';export async function requireUser(){if(!user)throw new Error('REDIRECT:/login');return user}`,
  '@/lib/legalConsent': `export async function ensureLegalConsent(){}`,
  '@/lib/supabase/authed-server': `export function createAuthedServerSupabase(){const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:{total_referrals:0}}),then:ok=>Promise.resolve({count:0}).then(ok)};return {rpc:async()=>({data:0,error:null}),from:()=>q}}`,
};
(async () => {
  for (const before of (fs.existsSync("/tmp/campusedux-polish-before/website/src/app/globals.css") ? [true, false] : [false])) {
    await esbuild.build({entryPoints:[web+'/tests/ui-audit/polish-fixture.tsx'],outfile:out+'/'+(before?'before':'after')+'.js',bundle:true,platform:'browser',jsx:'automatic',nodePaths:[web+'/node_modules'],define:{'process.env.NODE_ENV':'"production"','process.env':'{}'},plugins:[{name:'local-fixtures',setup(b){
      b.onResolve({filter:/.*/},a=>{
        if(mocks[a.path])return {path:a.path,namespace:'mock'};
        if(a.path.startsWith('@/')){const p=path.join(web,'src',a.path.slice(2));return {path:['.tsx','.ts','/index.ts'].map(ext=>p+ext).find(p=>fs.existsSync(p))||p};}
      });
      b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:web}));
      b.onLoad({filter:/website\/src\/.*\.(tsx|ts)$/},a=>{
        const snapshot='/tmp/campusedux-polish-before/'+path.relative(root,a.path);
        let contents=fs.readFileSync(before&&!a.path.endsWith('/ui/Skeleton.tsx')&&fs.existsSync(snapshot)?snapshot:a.path,'utf8');
        // React.cache is an RSC primitive absent from the browser fixture runtime.
        contents=contents.replace('import { cache } from "react";', 'const cache = (fn) => fn;').replace('import { cache, Suspense } from "react";', 'import { Suspense } from "react"; const cache = (fn) => fn;');
        return {contents,loader:a.path.endsWith('.tsx')?'tsx':'ts'};
      });
    }}]});
    const input=before?'/tmp/campusedux-polish-before/website/src/app/globals.css':web+'/src/app/globals.css';
    cp.execFileSync(process.execPath,[web+'/node_modules/tailwindcss/lib/cli.js','-c',web+'/tailwind.config.ts','-i',input,'-o',out+'/'+(before?'before':'after')+'.css','--content',web+'/src/**/*.{ts,tsx},/tmp/campusedux-polish-before/website/src/**/*.{ts,tsx}'],{stdio:'inherit'});
  }
})().catch(e=>{console.error(e);process.exit(1)});
