import React, { useState } from 'react';
import Layout from '../components/Layout';
import { ViewState, UserProfile } from '../types';
import { ArrowLeft, Save, GraduationCap, Globe, Target } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface ProfileViewProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  setView: (view: ViewState) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, setProfile, setView }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [saved, setSaved] = useState(false);

  const handleChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setProfile(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  return (
    <Layout 
      title={t('prof_title')}
      action={
        <button onClick={() => setView(ViewState.DASHBOARD)} className="text-gray-500 hover:text-gray-900">
          <ArrowLeft size={24} />
        </button>
      }
    >
      <div className="p-6 space-y-8 pb-20">
        
        {/* Languages */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold mb-2">
            <Globe size={20} />
            <h2>{t('prof_lang')}</h2>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('prof_app_lang')}</label>
              <select 
                value={formData.appLanguage}
                onChange={(e) => handleChange('appLanguage', e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Українська">Українська</option>
                <option value="English">English</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('prof_learn_lang')}</label>
              <select 
                value={formData.learningLanguage}
                onChange={(e) => handleChange('learningLanguage', e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Німецька">Німецька</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
              </select>
            </div>
          </div>
        </section>

        {/* Level */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold mb-2">
            <GraduationCap size={20} />
            <h2>{t('prof_level')}</h2>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('prof_cur_level')}</label>
              <div className="flex flex-wrap gap-2">
                {levels.map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => handleChange('level', lvl)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.level === lvl 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
             </div>
             
             <button className="w-full py-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors">
               {t('prof_test')}
             </button>
          </div>
        </section>

        {/* Goals & Context */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold mb-2">
            <Target size={20} />
            <h2>{t('prof_about')}</h2>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('prof_goal')}</label>
              <input 
                type="text"
                placeholder={t('prof_goal_ph')}
                value={formData.goal}
                onChange={(e) => handleChange('goal', e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('prof_sit')}</label>
              <textarea 
                rows={3}
                placeholder={t('prof_sit_ph')}
                value={formData.situation}
                onChange={(e) => handleChange('situation', e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('prof_chal')}</label>
              <textarea 
                rows={3}
                placeholder={t('prof_chal_ph')}
                value={formData.challenges}
                onChange={(e) => handleChange('challenges', e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
          </div>
        </section>

        <button 
          onClick={handleSave}
          className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {saved ? t('prof_saved') : <><Save size={20} /> {t('prof_save')}</>}
        </button>

      </div>
    </Layout>
  );
};

export default ProfileView;
