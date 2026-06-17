import { Wand2, Sparkles, Lock, Crown } from 'lucide-react';

export interface Skill {
  id: string;
  name: string;
  description: string;
  premium: boolean;
}

export interface SkillsSelectorProps {
  skills: Skill[];
  isPremium: boolean;
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function SkillCardSkeleton() {
  return (
    <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4 animate-pulse">
      <div className="flex items-start justify-between mb-2">
        <div className="h-4 bg-gray-700 rounded w-1/3"></div>
        <div className="h-5 bg-gray-700 rounded-full w-12"></div>
      </div>
      <div className="h-3 bg-gray-700 rounded w-2/3"></div>
    </div>
  );
}

export function SkillsSelector({ skills, isPremium, selectedSkills, onSkillsChange, loading, error, onRetry }: SkillsSelectorProps) {
  const freeSkills = skills.filter(s => !s.premium);
  const premiumSkills = skills.filter(s => s.premium);

  function toggleSkill(skillId: string) {
    const isSelected = selectedSkills.includes(skillId);
    if (isSelected) {
      if (selectedSkills.length <= 1) return;
      onSkillsChange(selectedSkills.filter(id => id !== skillId));
    } else {
      onSkillsChange([...selectedSkills, skillId]);
    }
  }

  function renderSkillCard(skill: Skill) {
    const isSelected = selectedSkills.includes(skill.id);
    const disabled = !isPremium && skill.premium;

    return (
      <button
        key={skill.id}
        type="button"
        onClick={() => !disabled && toggleSkill(skill.id)}
        disabled={disabled}
        className={`w-full text-left bg-gray-800/50 border rounded-xl p-4 transition-all duration-200 ${
          disabled
            ? 'border-gray-700/30 opacity-50 cursor-not-allowed'
            : isSelected
              ? 'border-purple-500/50 bg-purple-500/10'
              : 'border-gray-700/50 hover:border-gray-600/50 hover:bg-gray-800/70'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {isSelected && !disabled && (
              <div className="w-4 h-4 bg-purple-500 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {!isSelected && !disabled && (
              <div className="w-4 h-4 border border-gray-600 rounded"></div>
            )}
            <span className="text-sm font-medium text-white">{skill.name}</span>
          </div>
          {skill.premium ? (
            <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full text-xs font-medium">Pro</span>
          ) : (
            <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium">Basic</span>
          )}
        </div>
        <p className="text-xs text-gray-400 ml-6">{skill.description}</p>
      </button>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-600/10 to-orange-600/10 px-6 py-4 border-b border-gray-800/50">
          <div className="flex items-center space-x-3">
            <Wand2 className="w-5 h-5 text-yellow-400" />
            <h2 className="font-semibold text-white">Design Templates</h2>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4">
            <p className="text-sm text-red-300 mb-3">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-sm text-red-200 hover:text-white underline"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 px-6 py-4 border-b border-gray-800/50">
        <div className="flex items-center space-x-3">
          <Wand2 className="w-5 h-5 text-purple-400" />
          <h2 className="font-semibold text-white">Design Templates</h2>
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
        </div>
      </div>

      <div className="p-4 max-h-[40vh] overflow-auto">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkillCardSkeleton key={i} />
            ))}
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-6">
            <Wand2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No templates available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {freeSkills.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2 flex items-center space-x-1">
                  <span>Basic Templates</span>
                </h3>
                <div className="space-y-2">
                  {freeSkills.map(renderSkillCard)}
                </div>
              </div>
            )}

            {premiumSkills.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2 flex items-center space-x-1">
                  <span>Pro Templates</span>
                  <Crown className="w-3 h-3" />
                </h3>
                <div className="space-y-2">
                  {premiumSkills.map(renderSkillCard)}
                </div>
              </div>
            )}

            {!isPremium && (
              <div className="sticky bottom-0 pt-2">
                <button
                  type="button"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-purple-500/25"
                >
                  <Lock className="w-4 h-4" />
                  <span>Upgrade to Pro — $20/mo</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
