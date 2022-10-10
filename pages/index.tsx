import { Dialog } from "@headlessui/react";
import { FormEvent, MouseEvent, useCallback, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import PageDialog from "./components/PageDialog";
import _ from "lodash";
import axios from "axios";

function Home() {
  const [uploadIsOpen, setUploadIsOpen] = useState(true);
  const [selectIsOpen, setSelectIsOpen] = useState(false);
  const [files, setFiles] = useState<any>(null);
  const [pdf, setPdf] = useState<any>(null);
  const fileUploadInput = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (
        fileUploadInput.current?.files != null &&
        fileUploadInput.current.files.length > 0
      ) {
        setFiles(fileUploadInput.current.files);
        setUploadIsOpen(false);
        setSelectIsOpen(true);
      }
    },
    [fileUploadInput]
  );

  const formSubmitHandler = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const pages = _.get(event.target, "pages");
    let selectedPages = [];
    for (const [index, page] of pages.entries()) {
      if (page.checked) selectedPages.push(index);
    }
    const reqFormData = new FormData();
    reqFormData.append("file", files[0]);
    console.log(reqFormData.get("file"), reqFormData.get("pages"));
    axios.request({
      method: "POST",
      baseURL: process.env.NEXT_PUBLIC_YOLO_BACKEND_URL,
      url: `/predict?pages=${_.join(selectedPages, ",")}`,
      data: reqFormData,
    });
  };

  return (
    <>
      <PageDialog isOpen={uploadIsOpen} onClose={() => {}}>
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
      <PageDialog isOpen={selectIsOpen} onClose={() => {}}>
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
                  {pdf?._pdfInfo?.numPages != null &&
                    _.range(0, pdf._pdfInfo.numPages).map((index) => {
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
                className="ml-auto inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              >
                確定並上載
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </PageDialog>
    </>
  );
}

export default Home;
