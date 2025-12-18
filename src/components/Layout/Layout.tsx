import React, { useEffect } from 'react';
import { Header } from './Header';

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
    useEffect(() => {
        if (title) {
            document.title = `monEssensys - ${title}`;
        }
    }, [title]);

    return (
        <div className="es-blk-main">
            <Header />
            <section>
                <ul className="es-option">
                    <li>
                        <a href="/Account/UpdateMyInfos">
                            Modifier mes informations personnelles
                        </a>
                    </li>
                </ul>
                {children}
            </section>
        </div>
    );
};
