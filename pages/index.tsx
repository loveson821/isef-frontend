import { Dialog } from "@headlessui/react";
import {
  FormEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Document, Page } from "react-pdf";
import PageDialog from "../components/PageDialog";
import _ from "lodash";
import useAxios from "axios-hooks";
import { PDFDocument } from "pdf-lib";
import YOLOConfirmPage from "../components/YOLOConfirmPage";

function Home() {
  const [currentDialog, setCurrentDialog] = useState("upload");
  const [files, setFiles] = useState<any>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [
    { data: uploadFileToYOLOData, loading: uploadFileToYOLOLoading },
    uploadFileToYOLO,
  ] = useAxios(
    {
      method: "POST",
      baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    },
    { manual: true }
  );
  const [{}, uploadFileToOCR] = useAxios({
    method: "POST",
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  });
  const fileUploadInput = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (
        fileUploadInput.current?.files != null &&
        fileUploadInput.current.files.length > 0
      ) {
        setFiles(fileUploadInput.current.files);
        setCurrentDialog("select");
      }
    },
    [fileUploadInput]
  );

  const formSubmitHandler = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const pages = _.get(event.target, "pages");

      const fr = new FileReader();
      fr.onload = async (e) => {
        if (e.target?.result && typeof e.target.result !== "string") {
          const pdfDoc = await PDFDocument.load(
            new Uint8Array(e.target.result)
          );
          let removed = 0;
          if (pages.entries != null)
            for (const [index, page] of pages.entries()) {
              if (!page.checked) {
                pdfDoc.removePage(index - removed);
                removed++;
              }
            }
          pdfDoc.save().then((fileBytes) => {
            const file = new File([fileBytes], files[0].name);
            const reqFormData = new FormData();
            reqFormData.append("file", file);
            uploadFileToYOLO({
              url: `/predict?page_count=${pdfDoc.getPageCount()}`,
              data: reqFormData,
            });
          });
        }
      };
      fr.readAsArrayBuffer(files[0]);
    },
    [files, uploadFileToYOLO]
  );

  useEffect(() => {
    if (uploadFileToYOLOData != null) {
      setCurrentDialog("confirm_yolo");
    }
  }, [uploadFileToYOLOData]);

  return (
    <>
      <PageDialog isOpen={currentDialog === "upload"} onClose={() => {}}>
        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
          <Dialog.Title
            as="h3"
            className="text-lg font-medium leading-6 text-gray-900"
          >
            上載文件
          </Dialog.Title>
          <div className="mt-2">
            <p className="text-sm text-gray-500">讓 AI 分辨題目</p>
          </div>
          <div className="mt-4 flex items-center flex-wrap gap-2">
            <input
              type="file"
              accept=".pdf"
              ref={fileUploadInput}
              name="file"
            />
            <button
              type="button"
              className="ml-auto inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              onClick={upload}
            >
              選擇頁數
            </button>
          </div>
        </Dialog.Panel>
      </PageDialog>
      <PageDialog isOpen={currentDialog === "select"} onClose={() => {}}>
        <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
          <Dialog.Title
            as="h3"
            className="text-lg font-medium leading-6 text-gray-900"
          >
            選擇頁數
          </Dialog.Title>
          <div className="my-2">
            <p className="text-sm text-gray-500">選擇需要處理的頁數</p>
          </div>
          <form onSubmit={formSubmitHandler}>
            {files && (
              <Document
                file={files[0]}
                onLoadError={(error) => console.log(error)}
                onLoadSuccess={(pdf) => setPdf(pdf)}
              >
                <div className="flex gap-2 flex-wrap">
                  {pdf?.numPages != null &&
                    _.range(0, pdf.numPages).map((index) => {
                      return (
                        <label className="w-40 relative" key={index}>
                          <Page
                            className="rounded-xl overflow-hidden border w-full shadow"
                            width={160}
                            pageIndex={index}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                          />
                          <input
                            type="checkbox"
                            className="absolute right-0 bottom-0 rounded-full p-3"
                            name="pages"
                            defaultChecked
                            {...{
                              disabled: pdf.numPages === 1,
                            }}
                          />
                        </label>
                      );
                    })}
                </div>
              </Document>
            )}
            <div className="mt-4 flex items-center flex-wrap gap-2">
              <button
                type="submit"
                className={`ml-auto inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2${
                  uploadFileToYOLOLoading ? " opacity-50" : ""
                }`}
                {...{
                  disabled: uploadFileToYOLOLoading,
                }}
              >
                {uploadFileToYOLOLoading ? "處理中..." : "確定並上載"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </PageDialog>
      <PageDialog isOpen={currentDialog === "confirm_yolo"} onClose={() => {}}>
        <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
          {currentDialog === "confirm_yolo" && (
            <>
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                確定裁切
              </Dialog.Title>
              <div className="my-2">
                <p className="text-sm text-gray-500">由 AI 自動裁剪後之題目</p>
              </div>
              <YOLOConfirmPage data={uploadFileToYOLOData} />
              <div className="mt-4 flex items-center flex-wrap gap-2">
                <button
                  type="submit"
                  className={`ml-auto inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2${
                    uploadFileToYOLOLoading ? " opacity-50" : ""
                  }`}
                  {...{
                    disabled: uploadFileToYOLOLoading,
                  }}
                >
                  {uploadFileToYOLOLoading ? "處理中..." : "確定裁切"}
                </button>
              </div>
            </>
          )}
        </Dialog.Panel>
      </PageDialog>
    </>
  );
}

export default Home;
