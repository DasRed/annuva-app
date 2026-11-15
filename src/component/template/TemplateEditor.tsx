'use client';

import {IconArrowLeft, IconCloudCheck, IconEye, IconTrash} from '@tabler/icons-react';
import {useRouter} from 'next/navigation';
import {useCallback, useState} from 'react';
import apiFetch from '@/client/apiFetch';
import ApiClientError from '@/client/ApiClientError';
import openTemplatePreview from '@/client/openTemplatePreview';
import templatePreviewValues from '@/client/templatePreviewValues';
import useTemplatePreview from '@/client/useTemplatePreview';
import EntityForm from '@/component/entity/EntityForm';
import TemplatePreview from '@/component/template/TemplatePreview';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
import ConfirmButton from '@/component/ui/ConfirmButton';
import Notice from '@/component/ui/Notice';
import PageHeader from '@/component/ui/PageHeader';
import entities from '@/entity/entities';
import type EntityRecord from '@/entity/EntityRecord';
import useI18n from '@/i18n/useI18n';

/**
 * Editor of one invoice template: every change is saved immediately, the sample invoice next to
 * the form follows each keystroke. On small screens the preview opens in a new tab.
 */
export default function TemplateEditor({template}: { template: EntityRecord }) {
    const {t, td} = useI18n();
    const router = useRouter();
    const [values, setValues] = useState<Record<string, unknown>>(template);
    const [error, setError] = useState<string | null>(null);
    const preview = useTemplatePreview(templatePreviewValues(values));

    const save = useCallback(async (changes: Record<string, unknown>) => {
        await apiFetch(`/api/v1/invoice-templates/${template.id}`, {body: changes, method: 'PATCH'});
    }, [template.id]);

    return (
        <>
            <PageHeader
                eyebrow={td('entity.invoiceTemplates.plural', 'Invoice templates')}
                title={typeof values.name === 'string' && values.name.trim() !== '' ? values.name : td('entity.invoiceTemplates.singular', 'Template')}
                description={t('templates.editorDescription')}
                actions={(
                    <>
                        <Button href="/settings/templates" icon={<IconArrowLeft size={18} stroke={1.75}/>}>{t('templates.back')}</Button>
                        <ConfirmButton
                            variant="ghost"
                            icon={<IconTrash size={18} stroke={1.75}/>}
                            title={t('common.deleteTitle', {entity: td('entity.invoiceTemplates.singular', 'Template')})}
                            message={t('common.deleteMessage')}
                            confirmLabel={t('common.delete')}
                            onConfirm={async () => {
                                try {
                                    await apiFetch(`/api/v1/invoice-templates/${template.id}`, {method: 'DELETE'});
                                    router.push('/settings/templates');
                                }
                                catch (exception) {
                                    setError(exception instanceof ApiClientError ? exception.message : t('common.error'));
                                }
                            }}
                        >
                            {t('common.delete')}
                        </ConfirmButton>
                    </>
                )}
            />
            {error !== null ? <div className="mb-4"><Notice tone="error">{error}</Notice></div> : null}
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] 2xl:grid-cols-[minmax(0,1fr)_34rem]">
                <Card>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-sm text-text-muted">
                            <IconCloudCheck size={18} stroke={1.75}/>{t('common.autoSaveHint')}
                        </p>
                        <Button size="sm" className="lg:hidden" icon={<IconEye size={16} stroke={1.75}/>}
                                onClick={() => openTemplatePreview(templatePreviewValues(values)).catch(() => setError(t('templates.previewError')))}>
                            {t('templates.openPreview')}
                        </Button>
                    </div>
                    <EntityForm
                        autoSave={save}
                        entity="invoiceTemplates"
                        fields={entities.invoiceTemplates.fields}
                        formId="template"
                        initial={template}
                        onValuesChange={setValues}
                    />
                </Card>
                <Card title={t('templates.preview')} className="hidden lg:sticky lg:top-8 lg:block">
                    <TemplatePreview {...preview}/>
                </Card>
            </div>
        </>
    );
}
